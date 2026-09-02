import { readdir, readFile, writeFile } from 'node:fs/promises';
import { builtinModules } from 'node:module';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '..');
const sourceExtensions = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.svelte']);
const ignoredDirectories = new Set(['node_modules', 'dist', 'build', '.git', '.svelte-kit', 'coverage']);
const builtins = new Set([...builtinModules, ...builtinModules.map((name) => `node:${name}`)]);

async function walk(directory, predicate) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(path, predicate));
    else if (predicate(path)) result.push(path);
  }
  return result;
}

function packageRoot(specifier) {
  if (specifier.startsWith('@')) return specifier.split('/').slice(0, 2).join('/');
  return specifier.split('/')[0];
}

function importedSpecifiers(source, file) {
  const scriptSource = file.endsWith('.svelte')
    ? [...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map((match) => match[1]).join('\n')
    : source;
  const sourceFile = ts.createSourceFile(file, scriptSource, ts.ScriptTarget.Latest, true);
  const specifiers = [];
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (ts.isCallExpression(node) && node.arguments.length > 0 && ts.isStringLiteral(node.arguments[0])) {
      const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequire = ts.isIdentifier(node.expression) && node.expression.text === 'require';
      if (isDynamicImport || isRequire) specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return specifiers;
}

function kindOf(path) {
  const normalized = relative(root, path).split(sep).join('/');
  if (normalized.startsWith('apps/')) return 'app';
  if (normalized.startsWith('packages/nest/')) return 'nest';
  if (normalized.startsWith('packages/types/')) return 'types';
  if (normalized.startsWith('packages/browser/')) return 'browser';
  if (normalized.startsWith('packages/svelte/')) return 'svelte';
  if (normalized.startsWith('packages/testing/')) return 'testing';
  if (normalized.startsWith('packages/runtime/')) return 'runtime';
  return 'unknown';
}

function expectedName(path) {
  const parts = relative(join(root, 'packages'), path).split(sep);
  if (parts[0] === 'nest') return `@platform/nest-${parts[1]}-${parts[2]}`;
  if (parts[0] === 'types') return `@platform/types-${parts[1]}`;
  if (parts[0] === 'browser') return `@platform/browser-${parts[1]}`;
  if (parts[0] === 'svelte') return `@platform/svelte-${parts[1]}`;
  if (parts[0] === 'testing') return `@platform/test-${parts[1]}`;
  if (parts[0] === 'runtime') return `@platform/runtime-${parts[1]}`;
  return null;
}

function allowedKinds(source, target, sourceName) {
  if (source === 'types') return target === 'types';
  if (source === 'browser') return target === 'types';
  if (source === 'svelte') return target === 'types' || target === 'browser';
  if (source === 'nest') return target === 'types' || target === 'nest';
  if (source === 'testing') return target !== 'app';
  if (source === 'runtime') return target === 'types' || target === 'runtime';
  if (source === 'app' && (sourceName === '@platform/web' || sourceName === '@platform/storybook')) {
    return target === 'types' || target === 'browser' || target === 'svelte';
  }
  if (source === 'app') return target !== 'browser' && target !== 'svelte' && target !== 'testing';
  return false;
}

async function loadPackages() {
  const manifests = await walk(root, (path) => basename(path) === 'package.json');
  const packages = [];
  for (const manifestPath of manifests) {
    const directory = dirname(manifestPath);
    if (directory === root) continue;
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    if (!manifest.name) continue;
    packages.push({
      name: manifest.name,
      directory,
      manifest,
      kind: kindOf(directory),
      relativePath: relative(root, directory).split(sep).join('/'),
    });
  }
  return packages.sort((a, b) => a.name.localeCompare(b.name));
}

function findCycles(graph) {
  const cycles = new Set();
  const visited = new Set();
  const active = [];
  const activeSet = new Set();
  function visit(node) {
    if (activeSet.has(node)) {
      const start = active.indexOf(node);
      cycles.add([...active.slice(start), node].join(' -> '));
      return;
    }
    if (visited.has(node)) return;
    active.push(node);
    activeSet.add(node);
    for (const target of graph.get(node) ?? []) visit(target);
    active.pop();
    activeSet.delete(node);
    visited.add(node);
  }
  for (const node of graph.keys()) visit(node);
  return [...cycles].sort();
}

async function analyze(packages) {
  const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
  const errors = [];
  const graph = new Map(packages.map((pkg) => [pkg.name, new Set()]));

  for (const pkg of packages) {
    const dependencyGroups = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
    const listed = new Set(dependencyGroups.flatMap((group) => Object.keys(pkg.manifest[group] ?? {})));
    const runtimeListed = new Set(Object.keys(pkg.manifest.dependencies ?? {}));

    if (pkg.kind !== 'app') {
      const expected = expectedName(pkg.directory);
      if (expected !== pkg.name) errors.push(`${pkg.name}: 路徑要求套件名稱為 ${expected}`);
      try {
        await readFile(join(pkg.directory, 'README.md'), 'utf8');
      } catch {
        errors.push(`${pkg.name}: 缺少 README.md`);
      }
      if (!pkg.manifest.description) errors.push(`${pkg.name}: package.json 缺少 description`);
      if (!pkg.manifest.platform) errors.push(`${pkg.name}: package.json 缺少 platform metadata`);
    }

    if (pkg.kind === 'types') {
      const forbidden = [...listed].filter((name) => name.startsWith('@nestjs/') || name === 'class-validator');
      if (forbidden.length) errors.push(`${pkg.name}: types 套件不得依賴 ${forbidden.join(', ')}`);
    }

    for (const dependency of runtimeListed) {
      if (!dependency.startsWith('@platform/')) continue;
      const target = byName.get(dependency);
      if (!target) {
        errors.push(`${pkg.name}: workspace dependency ${dependency} 無法解析`);
        continue;
      }
      graph.get(pkg.name).add(dependency);
      if (pkg.kind !== 'app' && target.kind === 'app') {
        errors.push(`${pkg.name}: package 不得依賴 app ${dependency}`);
      } else if (!allowedKinds(pkg.kind, target.kind, pkg.name)) {
        errors.push(`${pkg.name}: ${pkg.kind} layer 不得依賴 ${target.kind} layer (${dependency})`);
      }
    }

    const sourceFiles = await walk(pkg.directory, (path) => sourceExtensions.has(path.slice(path.lastIndexOf('.'))));
    for (const file of sourceFiles) {
      const source = await readFile(file, 'utf8');
      for (const specifier of importedSpecifiers(source, file)) {
        if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('#') || specifier.startsWith('$') || builtins.has(specifier)) continue;
        const dependency = packageRoot(specifier);
        if (dependency === pkg.name) continue;
        if (dependency.startsWith('@platform/') && !byName.has(dependency)) {
          errors.push(`${pkg.name}: ${relative(root, file)} 匯入無法解析的 ${dependency}`);
        }
        if (!listed.has(dependency) && dependency !== 'bun:test') {
          errors.push(`${pkg.name}: ${relative(root, file)} 匯入未宣告的 ${dependency}`);
        }
      }
    }
  }

  for (const cycle of findCycles(graph)) errors.push(`循環相依: ${cycle}`);
  return { errors: [...new Set(errors)].sort(), graph };
}

function graphDocument(packages, graph) {
  const lines = [
    '# 套件相依圖',
    '',
    '> 此檔案由 `bun run deps:graph` 產生，請勿手動修改。箭頭表示「來源依賴目標」。',
    '',
    '```mermaid',
    'flowchart LR',
  ];
  const id = new Map(packages.map((pkg, index) => [pkg.name, `P${index}`]));
  for (const pkg of packages) lines.push(`  ${id.get(pkg.name)}["${pkg.name}"]`);
  for (const [source, targets] of [...graph].sort()) {
    for (const target of [...targets].sort()) lines.push(`  ${id.get(source)} --> ${id.get(target)}`);
  }
  lines.push('```', '', '## 套件位置', '');
  for (const pkg of packages) lines.push(`- \`${pkg.name}\` — \`${pkg.relativePath}\``);
  lines.push('');
  return lines.join('\n');
}

const command = process.argv[2] ?? 'check';
const packages = await loadPackages();
const { errors, graph } = await analyze(packages);
const graphPath = join(root, 'doc', 'system-spec', 'architecture', 'package-dependencies.md');
const generatedGraph = graphDocument(packages, graph);

if (command === 'graph') {
  await writeFile(graphPath, generatedGraph);
  console.log(`已更新 ${relative(root, graphPath)}`);
} else if (command === 'check-graph') {
  const current = await readFile(graphPath, 'utf8').catch(() => '');
  if (current !== generatedGraph) errors.push('套件相依圖已過期，請執行 bun run deps:graph');
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`依賴檢查通過：${packages.length} 個 workspace，沒有循環或邊界違規。`);
}
