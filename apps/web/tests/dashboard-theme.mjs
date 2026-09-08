import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { chromium } from 'playwright';

const webDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const viteBinary = resolve(webDirectory, '../../node_modules/.bin/vite');
const baseUrl = 'http://127.0.0.1:4317';
const screenshotDirectory = process.env.THEME_SCREENSHOT_DIR;

const server = spawn(
  viteBinary,
  ['dev', '--host', '127.0.0.1', '--port', '4317', '--strictPort'],
  {
  cwd: webDirectory,
  stdio: ['ignore', 'pipe', 'pipe'],
  }
);

let serverOutput = '';
server.stdout.on('data', (chunk) => (serverOutput += chunk));
server.stderr.on('data', (chunk) => (serverOutput += chunk));

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 200));
  }
  throw new Error(`Web server did not start.\n${serverOutput}`);
}

function apiResponse(data) {
  return JSON.stringify({ statusCode: 200, message: 'OK', data });
}

function colorIsDark(color) {
  const rgb = color.match(/^rgba?\((\d+),?\s+(\d+),?\s+(\d+)/);
  if (rgb) {
    return Number(rgb[1]) < 128 && Number(rgb[2]) < 128 && Number(rgb[3]) < 128;
  }

  const oklch = color.match(/^oklch\(([\d.]+)/);
  if (oklch) return Number(oklch[1]) < 0.5;

  throw new Error(`Unsupported computed color: ${color}`);
}

function colorIsLight(color) {
  const rgb = color.match(/^rgba?\((\d+),?\s+(\d+),?\s+(\d+)/);
  if (rgb) {
    return Number(rgb[1]) > 180 && Number(rgb[2]) > 180 && Number(rgb[3]) > 180;
  }

  const oklch = color.match(/^oklch\(([\d.]+)/);
  if (oklch) return Number(oklch[1]) > 0.7;

  throw new Error(`Unsupported computed color: ${color}`);
}

let browser;
let roles = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'System administrators',
    isSystem: true,
    createdAt: '2026-09-02T00:00:00.000Z',
    rolePermissions: [],
  },
  {
    id: 'editor',
    name: 'Custom Editor',
    description: 'A deletable custom role',
    isSystem: false,
    createdAt: '2026-09-02T00:00:00.000Z',
    rolePermissions: [],
  },
];

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const diagnostics = [];
  page.on('console', (message) => diagnostics.push(`console ${message.type()}: ${message.text()}`));
  page.on('pageerror', (error) => diagnostics.push(`page error: ${error.message}`));
  page.on('requestfailed', (request) =>
    diagnostics.push(`request failed: ${request.url()} (${request.failure()?.errorText})`)
  );

  await page.addInitScript(() => {
    localStorage.setItem('mode-watcher-mode', 'dark');
    localStorage.setItem('app.session.v1', JSON.stringify({ token: 'theme-test-token' }));
  });

  await page.route('http://localhost:3333/v1/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    diagnostics.push(`${route.request().method()} ${pathname}`);
    const headers = {
      'access-control-allow-origin': baseUrl,
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'authorization, content-type',
      'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'content-type': 'application/json',
    };

    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers });
      return;
    }

    if (pathname === '/v1/admin/me') {
      await route.fulfill({
        status: 200,
        headers,
        body: apiResponse({
          id: 1,
          name: 'Theme Test Admin',
          email: 'admin@example.com',
          userRoles: [{ role: { id: 'admin', name: 'Administrator' } }],
        }),
      });
      return;
    }

    if (pathname === '/v1/admin/roles' && route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        headers,
        body: apiResponse(roles),
      });
      return;
    }

    if (pathname === '/v1/admin/roles/editor' && route.request().method() === 'DELETE') {
      roles = roles.filter((role) => role.id !== 'editor');
      await route.fulfill({ status: 200, headers, body: apiResponse({ deleted: true }) });
      return;
    }

    if (pathname === '/v1/admin/permissions') {
      await route.fulfill({ status: 200, headers, body: apiResponse([]) });
      return;
    }

    if (pathname === '/v1/admin/users') {
      await route.fulfill({
        status: 200,
        headers,
        body: apiResponse({
          data: [{
            id: 1,
            name: 'Theme Test Admin',
            email: 'admin@example.com',
            createdAt: '2026-09-02T00:00:00.000Z',
            userRoles: [{ role: { id: 'admin', name: 'Administrator', description: '', isSystem: true } }],
          }],
          meta: { page: 1, limit: 10, total: 1 },
        }),
      });
      return;
    }

    if (pathname === '/v1/cms/dashboard/analytics') {
      await route.fulfill({
        status: 200,
        headers,
        body: apiResponse({
          dailyViews: [{ date: '2026-09-02', views: 12 }],
          topPosts: [
            {
              id: 'post-1',
              slug: 'dark-theme',
              title: 'Dark theme',
              viewCount: 12,
              updatedAt: '2026-09-02T00:00:00.000Z',
            },
          ],
          topTags: [
            { id: 'tag-1', name: 'Design', slug: 'design', totalViews: 12, postCount: 1 },
          ],
        }),
      });
      return;
    }

    if (pathname === '/v1/cms/posts') {
      await route.fulfill({
        status: 200,
        headers,
        body: apiResponse({
          data: [{
            id: 'post-1',
            slug: 'dark-theme',
            title: 'Dark theme',
            status: 'draft',
            tags: [],
            viewCount: 12,
            createdAt: '2026-09-02T00:00:00.000Z',
            updatedAt: '2026-09-02T00:00:00.000Z',
          }],
          page: 1,
          limit: 20,
          total: 1,
        }),
      });
      return;
    }

    if (pathname === '/v1/cms/assets') {
      await route.fulfill({
        status: 200,
        headers,
        body: apiResponse({
          data: [{
            id: 'asset-1',
            storageProvider: 's3',
            bucket: 'assets',
            storageKey: 'documents/guide.pdf',
            originalName: 'guide.pdf',
            status: 'ready',
            mimeType: 'application/pdf',
            size: 2048,
            ownerId: 1,
            visibility: 'public',
            createdAt: '2026-09-02T00:00:00.000Z',
            updatedAt: '2026-09-02T00:00:00.000Z',
          }],
          page: 1,
          limit: 50,
          total: 1,
        }),
      });
      return;
    }

    if (pathname === '/v1/cms/posts/post-1') {
      await route.fulfill({
        status: 200,
        headers,
        body: apiResponse({
          id: 'post-1',
          slug: 'dark-theme',
          status: 'draft',
          authorId: 1,
          createdAt: '2026-09-02T00:00:00.000Z',
          updatedAt: '2026-09-02T00:00:00.000Z',
          content: {
            title: 'Dark theme',
            body: { type: 'doc', content: [{ type: 'paragraph' }] },
            seoTitle: '',
            seoDesc: '',
          },
          tags: [],
        }),
      });
      return;
    }

    if (pathname === '/v1/cms/tags') {
      await route.fulfill({
        status: 200,
        headers,
        body: apiResponse({ data: [] }),
      });
      return;
    }

    await route.abort();
  });

  await page.goto(`${baseUrl}/admin`);
  try {
    await page.getByRole('heading', { name: 'Daily Clicks' }).waitFor();
  } catch (error) {
    const body = await page.locator('body').innerText();
    throw new Error(
      `Dashboard did not load at ${page.url()}.\n${diagnostics.join('\n')}\nPage text:\n${body}`,
      { cause: error }
    );
  }

  const surfaceColors = await page
    .locator('main article, main section, main select')
    .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).backgroundColor));
  const headingColors = await page
    .locator('main h1, main h2')
    .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).color));

  const lightSurface = surfaceColors.find((color) => !colorIsDark(color));
  if (lightSurface) {
    throw new Error(`Dashboard kept a light surface in dark mode: ${lightSurface}`);
  }

  const darkHeading = headingColors.find((color) => !colorIsLight(color));
  if (darkHeading) {
    throw new Error(`Dashboard kept dark heading text in dark mode: ${darkHeading}`);
  }

  if (screenshotDirectory) {
    await mkdir(screenshotDirectory, { recursive: true });
    await page.screenshot({ path: resolve(screenshotDirectory, 'dashboard-dark.png'), fullPage: true });
  }

  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await page.waitForFunction(() => !document.documentElement.classList.contains('dark'));
  const lightDashboardSurfaces = await page
    .locator('main article, main section, main select')
    .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).backgroundColor));
  const darkDashboardSurface = lightDashboardSurfaces.find((color) => !colorIsLight(color));
  if (darkDashboardSurface) {
    throw new Error(`Dashboard kept a dark surface after switching to light mode: ${darkDashboardSurface}`);
  }

  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));

  for (const collection of [
    { path: '/admin/cms', heading: 'CMS Management', name: 'CMS list' },
    { path: '/admin/assets', heading: 'Media Library', name: 'Assets list' },
    { path: '/admin/users', heading: 'Users', name: 'Users list' },
    { path: '/admin/roles', heading: 'Roles', name: 'Roles list' },
  ]) {
    await page.goto(`${baseUrl}${collection.path}`);
    await page.getByRole('heading', { name: collection.heading, level: 1 }).waitFor();
    for (const controlName of ['Filter', 'Sort']) {
      if ((await page.getByRole('button', { name: controlName }).count()) !== 1) {
        throw new Error(`${collection.name} is missing its shared ${controlName} control.`);
      }
    }
    if ((await page.getByRole('button', { name: /^Search/ }).count()) !== 1) {
      throw new Error(`${collection.name} is missing its shared search control.`);
    }
    const collectionSurfaces = await page
      .locator('main table:visible, main input:visible, main select:visible, main [data-theme-surface]:visible')
      .evaluateAll((elements) => elements
        .map((element) => ({
          element: `${element.tagName.toLowerCase()}.${element.className}`,
          color: getComputedStyle(element).backgroundColor,
        }))
        .filter(({ color }) => color !== 'rgba(0, 0, 0, 0)'));
    const lightCollectionSurface = collectionSurfaces.find(({ color }) => !colorIsDark(color));
    if (lightCollectionSurface) {
      throw new Error(
        `${collection.name} kept a light surface in dark mode: ${lightCollectionSurface.element} (${lightCollectionSurface.color})`
      );
    }
  }

  const customRoleCard = page
    .getByRole('heading', { name: 'Custom Editor', exact: true })
    .locator('xpath=ancestor::div[contains(@class, "group")][1]');
  await customRoleCard.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByText('Role deleted successfully', { exact: true }).waitFor();
  if ((await page.getByRole('heading', { name: 'Custom Editor', exact: true }).count()) !== 0) {
    throw new Error('Deleted role remains visible when the success toast appears.');
  }

  await page.goto(`${baseUrl}/admin/cms/post-1`);
  await page.getByRole('heading', { name: 'Settings', exact: true }).waitFor();
  await page.locator('.tiptap-editor').waitFor();

  const editorWorkspace = page.getByRole('region', { name: 'Article editor workspace' });
  const editorCanvas = page.locator('.tiptap-editor').locator('xpath=../..');
  const [workspaceBox, editorCanvasBox] = await Promise.all([
    editorWorkspace.boundingBox(),
    editorCanvas.boundingBox(),
  ]);
  if (!workspaceBox || !editorCanvasBox) {
    throw new Error('Unable to measure the article editor layout.');
  }
  const workspaceCenter = workspaceBox.x + workspaceBox.width / 2;
  const editorCenter = editorCanvasBox.x + editorCanvasBox.width / 2;
  if (Math.abs(workspaceCenter - editorCenter) > 12) {
    throw new Error(
      `Article editor is not horizontally centered when no TOC exists (offset ${Math.abs(workspaceCenter - editorCenter)}px).`
    );
  }

  const editorSurfaceColors = await page
    .locator(
      'main div:visible, main header:visible, main input:visible, main select:visible, main textarea:visible, main .tiptap-editor:visible'
    )
    .evaluateAll((elements) =>
      elements
        .map((element) => ({
          element: `${element.tagName.toLowerCase()}.${element.className}`,
          color: getComputedStyle(element).backgroundColor,
        }))
        .filter(({ color }) => color !== 'rgba(0, 0, 0, 0)')
    );

  const lightEditorSurface = editorSurfaceColors.find(({ color }) => !colorIsDark(color));
  if (lightEditorSurface) {
    throw new Error(
      `CMS editor kept a light surface in dark mode: ${lightEditorSurface.element} (${lightEditorSurface.color})`
    );
  }

  const editorTextColors = await page
    .locator('main h3:visible, main h4:visible, main label:visible')
    .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).color));
  const darkEditorText = editorTextColors.find((color) => !colorIsLight(color));
  if (darkEditorText) {
    throw new Error(`CMS editor kept dark text in dark mode: ${darkEditorText}`);
  }

  const placeholderColor = await page
    .locator('.tiptap-editor .ProseMirror p.is-editor-empty')
    .evaluate((element) => getComputedStyle(element, '::before').color);
  if (!colorIsLight(placeholderColor)) {
    throw new Error(`CMS editor placeholder is unreadable in dark mode: ${placeholderColor}`);
  }

  const editableParagraph = page.locator('.tiptap-editor .ProseMirror > p').first();
  await editableParagraph.click();
  await page.keyboard.type('First line');
  await page.keyboard.press('Enter');
  const paragraphCountAfterEnter = await page
    .locator('.tiptap-editor .ProseMirror > p')
    .count();
  if (paragraphCountAfterEnter !== 2) {
    throw new Error(
      `Enter did not create a new paragraph (found ${paragraphCountAfterEnter}).\n${diagnostics.join('\n')}`
    );
  }

  const prosemirrorRuntimeError = diagnostics.find((entry) =>
    entry.includes('multiple versions of prosemirror-model')
  );
  if (prosemirrorRuntimeError) {
    throw new Error(`Enter triggered a ProseMirror runtime error: ${prosemirrorRuntimeError}`);
  }

  await page.reload();
  await page.getByRole('heading', { name: 'Settings', exact: true }).waitFor();
  const hoverEditor = page.locator('.tiptap-editor .ProseMirror');
  const hoverParagraph = hoverEditor.locator(':scope > p').first();
  const [hoverEditorBox, hoverParagraphBox] = await Promise.all([
    hoverEditor.boundingBox(),
    hoverParagraph.boundingBox(),
  ]);
  if (!hoverEditorBox || !hoverParagraphBox) {
    throw new Error('Unable to measure the editor hover target.');
  }

  await page.mouse.move(
    hoverEditorBox.x - 40,
    hoverParagraphBox.y + hoverParagraphBox.height / 2
  );
  const addBlockButton = page.getByRole('button', { name: '在下方新增一行' });
  if ((await addBlockButton.count()) !== 1 || !(await addBlockButton.isVisible())) {
    throw new Error('The block toolbar cannot be opened directly from the editor gutter.');
  }

  await page.mouse.move(
    hoverEditorBox.x + 20,
    hoverParagraphBox.y + hoverParagraphBox.height + 24
  );
  if (!(await addBlockButton.isVisible())) {
    throw new Error('The block toolbar disappears inside the expanded row hover area.');
  }

  const editorInteractionZone = hoverEditor.locator('xpath=..');
  const interactionZoneBox = await editorInteractionZone.boundingBox();
  if (!interactionZoneBox) {
    throw new Error('Unable to measure the editor interaction zone.');
  }

  const paragraphCountBeforeCanvasClick = await hoverEditor.locator(':scope > p').count();
  await editorInteractionZone.click({
    position: {
      x: hoverEditorBox.x - interactionZoneBox.x + hoverEditorBox.width / 2,
      y: Math.min(
        interactionZoneBox.height - 10,
        hoverParagraphBox.y - interactionZoneBox.y + hoverParagraphBox.height + 120
      ),
    },
  });
  const paragraphCountAfterCanvasClick = await hoverEditor.locator(':scope > p').count();
  if (paragraphCountAfterCanvasClick !== paragraphCountBeforeCanvasClick + 1) {
    throw new Error('Clicking the blank article canvas did not create a new paragraph.');
  }

  await page.keyboard.type('Created from canvas click');
  const clickedParagraphText = await hoverEditor.locator(':scope > p').last().textContent();
  if (clickedParagraphText !== 'Created from canvas click') {
    throw new Error('The paragraph created from the canvas click did not receive focus.');
  }

  const collapseSettingsButton = page.getByRole('button', {
    name: 'Collapse article settings',
  });
  if ((await collapseSettingsButton.count()) !== 1) {
    throw new Error('Desktop article settings has no single accessible collapse control.');
  }

  const articleSettings = page.getByRole('complementary', { name: 'Article settings' });
  await page.setViewportSize({ width: 1440, height: 600 });
  const settingsOverflow = await articleSettings.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    overflowY: getComputedStyle(element).overflowY,
  }));
  if (settingsOverflow.scrollHeight <= settingsOverflow.clientHeight) {
    throw new Error('The short viewport did not exercise overflowing article settings.');
  }
  if (!['auto', 'scroll'].includes(settingsOverflow.overflowY)) {
    throw new Error(
      `Article settings clips overflowing content with overflow-y: ${settingsOverflow.overflowY}.`
    );
  }

  await articleSettings.hover();
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(50);
  if ((await articleSettings.evaluate((element) => element.scrollTop)) === 0) {
    throw new Error('Article settings cannot be scrolled with the mouse wheel.');
  }
  await page.setViewportSize({ width: 1440, height: 1000 });

  const expandedWorkspaceWidth = await editorWorkspace.evaluate(
    (element) => element.getBoundingClientRect().width
  );

  await collapseSettingsButton.focus();
  await page.keyboard.press('Enter');
  if (await articleSettings.isVisible()) {
    throw new Error('Article settings remains visible after being collapsed.');
  }
  await page.waitForTimeout(250);

  const expandSettingsButton = page.getByRole('button', { name: 'Expand article settings' });
  if ((await expandSettingsButton.count()) !== 1 || !(await expandSettingsButton.isVisible())) {
    throw new Error('Collapsed article settings does not leave one accessible expand control.');
  }

  const collapsedWorkspaceWidth = await editorWorkspace.evaluate(
    (element) => element.getBoundingClientRect().width
  );
  if (collapsedWorkspaceWidth <= expandedWorkspaceWidth) {
    throw new Error('Article editor workspace did not grow after settings was collapsed.');
  }

  const [collapsedWorkspaceBox, collapsedEditorCanvasBox] = await Promise.all([
    editorWorkspace.boundingBox(),
    editorCanvas.boundingBox(),
  ]);
  if (!collapsedWorkspaceBox || !collapsedEditorCanvasBox) {
    throw new Error('Unable to measure the expanded article editor layout.');
  }
  const collapsedWorkspaceCenter = collapsedWorkspaceBox.x + collapsedWorkspaceBox.width / 2;
  const collapsedEditorCenter = collapsedEditorCanvasBox.x + collapsedEditorCanvasBox.width / 2;
  if (Math.abs(collapsedWorkspaceCenter - collapsedEditorCenter) > 12) {
    throw new Error(
      `Article editor is not horizontally centered after settings collapse (offset ${Math.abs(collapsedWorkspaceCenter - collapsedEditorCenter)}px).`
    );
  }

  if (screenshotDirectory) {
    await page.screenshot({
      path: resolve(screenshotDirectory, 'cms-editor-settings-collapsed.png'),
      fullPage: true,
    });
  }

  await expandSettingsButton.click();
  if (!(await articleSettings.isVisible())) {
    throw new Error('Article settings did not reopen from its single expand control.');
  }

  await collapseSettingsButton.click();
  await page.reload();
  await page.getByRole('heading', { name: 'Settings', exact: true }).waitFor();
  if (!(await articleSettings.isVisible())) {
    throw new Error('Article settings did not return to its default expanded state after reload.');
  }

  await page.setViewportSize({ width: 800, height: 1000 });
  const openMobileSettingsButton = page.getByRole('button', { name: 'Open settings' });
  if (!(await openMobileSettingsButton.isVisible())) {
    throw new Error('The existing mobile article settings drawer trigger is no longer available.');
  }
  if (await articleSettings.isVisible()) {
    throw new Error('Desktop article settings remains visible at the mobile breakpoint.');
  }

  await openMobileSettingsButton.click();
  const mobileSettingsHeading = page.getByRole('heading', { name: 'Settings', exact: true });
  if (!(await mobileSettingsHeading.isVisible())) {
    throw new Error('The existing mobile article settings drawer no longer opens.');
  }

  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1440, height: 1000 });

  if (screenshotDirectory) {
    await page.screenshot({ path: resolve(screenshotDirectory, 'cms-editor-dark.png'), fullPage: true });
  }

  console.log('Admin UI regression test passed.');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
