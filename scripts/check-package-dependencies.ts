import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

type Manifest = {
  name: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const root = process.cwd();
const packagesRoot = join(root, 'packages');
const manifests = readdirSync(packagesRoot)
  .map((directory) => ({
    directory,
    manifestPath: join(packagesRoot, directory, 'package.json'),
  }))
  .filter(({ manifestPath }) => existsSync(manifestPath))
  .map(({ directory, manifestPath }) => ({
    directory,
    manifest: JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest,
  }));
const byName = new Map(manifests.map((entry) => [entry.manifest.name, entry]));
const graph = new Map<string, string[]>();
const errors: string[] = [];
const neutralPackages = new Set([
  '@platform/cms',
  '@platform/contracts',
  '@platform/task-runtime',
  '@platform/test-utils',
]);
const forbiddenNeutralDependencies = [
  '@nestjs/',
  'express',
  'drizzle-orm',
  'svelte',
  '@sveltejs/',
];

for (const { directory, manifest } of manifests) {
  const allDependencies = {
    ...manifest.dependencies,
    ...manifest.devDependencies,
    ...manifest.peerDependencies,
  };
  const runtimeWorkspaceDependencies = Object.keys(
    manifest.dependencies ?? {},
  ).filter((name) => name.startsWith('@platform/'));
  graph.set(manifest.name, runtimeWorkspaceDependencies);

  if (!existsSync(join(packagesRoot, directory, 'README.md'))) {
    errors.push(`${manifest.name}: missing README.md`);
  }

  for (const dependency of runtimeWorkspaceDependencies) {
    if (!byName.has(dependency)) {
      errors.push(
        `${manifest.name}: unknown workspace dependency ${dependency}`,
      );
    }
    if (manifest.dependencies?.[dependency] !== 'workspace:*') {
      errors.push(`${manifest.name}: ${dependency} must use workspace:*`);
    }
  }

  if (neutralPackages.has(manifest.name)) {
    for (const dependency of Object.keys(allDependencies)) {
      if (
        forbiddenNeutralDependencies.some(
          (prefix) => dependency === prefix || dependency.startsWith(prefix),
        )
      ) {
        errors.push(
          `${manifest.name}: framework-neutral package depends on ${dependency}`,
        );
      }
    }
  }

  for (const file of sourceFiles(join(packagesRoot, directory, 'src'))) {
    const source = readFileSync(file, 'utf8');
    for (const imported of source.matchAll(
      /(?:from\s+|import\s*\()\s*['"](@platform\/[^/'"]+)/g,
    )) {
      const dependency = imported[1];
      if (dependency !== manifest.name && !allDependencies[dependency]) {
        errors.push(
          `${manifest.name}: imports undeclared dependency ${dependency} in ${file.replace(`${root}/`, '')}`,
        );
      }
    }
  }
}

for (const cycle of findCycles(graph)) {
  errors.push(`dependency cycle: ${cycle.join(' -> ')}`);
}

if (process.argv.includes('--graph')) {
  console.log('graph TD');
  for (const [name, dependencies] of [...graph.entries()].sort()) {
    const source = id(name);
    if (dependencies.length === 0) console.log(`  ${source}["${name}"]`);
    for (const dependency of dependencies.sort()) {
      console.log(
        `  ${source}["${name}"] --> ${id(dependency)}["${dependency}"]`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exitCode = 1;
} else if (!process.argv.includes('--graph')) {
  console.log(
    `Package dependency check passed (${manifests.length} packages).`,
  );
}

function sourceFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory()
      ? sourceFiles(path)
      : /\.(?:ts|svelte)$/.test(name)
        ? [path]
        : [];
  });
}

function findCycles(dependencies: Map<string, string[]>): string[][] {
  const cycles: string[][] = [];
  const completed = new Set<string>();
  const visit = (name: string, path: string[]) => {
    const index = path.indexOf(name);
    if (index >= 0) {
      cycles.push([...path.slice(index), name]);
      return;
    }
    if (completed.has(name)) return;
    for (const dependency of dependencies.get(name) ?? []) {
      visit(dependency, [...path, name]);
    }
    completed.add(name);
  };
  for (const name of dependencies.keys()) visit(name, []);
  return cycles;
}

function id(name: string) {
  return name.replace(/[^a-zA-Z0-9]/g, '_');
}
