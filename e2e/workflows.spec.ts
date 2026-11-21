import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';

const fixture = sharp({ create: { width: 32, height: 32, channels: 3, background: '#226633' } }).png().toBuffer();
const photo = async () => ({ name: 'incident.png', mimeType: 'image/png', buffer: await fixture });

test.beforeEach(async ({ page }) => {
  // Keep app behavior reproducible when external map tiles or stock photos are unavailable.
  await page.route(/^https:\/\/(?:server\.arcgisonline\.com|[a-d]\.basemaps\.cartocdn\.com|images\.unsplash\.com)\//,
    async (route) => route.fulfill({ contentType: 'image/png', body: await fixture }));
});

async function checkAccessibility(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(violations.map(({ id, nodes }) => ({
    id, elements: nodes.map((node) => ({ target: node.target, reason: node.failureSummary })),
  }))).toEqual([]);
}

test('publishes an uploaded photo from the feed, comments, and toggles a reaction', async ({ page }, testInfo) => {
  await page.goto('/complaints');
  await expect(page.getByRole('article').first()).toBeVisible();
  await page.getByRole('button', { name: 'Post as Guest User' }).click();
  const title = `Overflowing test bin in ${testInfo.project.name}`;
  await page.getByLabel('Incident Title / Summary').fill(title);
  await page.getByLabel('Attach report photo').setInputFiles(await photo());
  await expect(page.getByRole('img', { name: 'Preview' })).toBeVisible();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Publish as Guest User' }).click();
  await expect(page.getByText('Your report has been published', { exact: false })).toBeVisible();
  const report = page.getByRole('article').filter({ hasText: title });
  const image = report.getByRole('img', { name: title });
  await image.scrollIntoViewIfNeeded();
  await expect(image).toHaveJSProperty('complete', true);
  expect(await image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
  const like = report.getByRole('button', { name: /Like report/ });
  await like.click();
  await expect(like).toHaveAttribute('aria-pressed', 'true');
  await like.click();
  await expect(like).toHaveAttribute('aria-pressed', 'false');
  await report.getByRole('button', { name: /0 Comments/ }).click();
  await report.getByLabel('Comment as Guest User').fill('This bin is beside the market.');
  await report.getByRole('button', { name: 'Post comment' }).click();
  await expect(report.getByText('This bin is beside the market.')).toBeVisible();
  await checkAccessibility(page);
  await report.getByRole('link', { name: 'Full Report' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.getByText('This bin is beside the market.')).toBeVisible();
});

test('exposes a keyboard skip link and map data directory', async ({ page }) => {
  await page.goto('/map');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  const directory = page.getByRole('region', { name: 'Accessible Data List View' });
  await directory.getByRole('button', { name: /Waterbodies/ }).click();
  await expect(directory.getByRole('table')).toContainText('Deepor Beel');
  await checkAccessibility(page);
});

test('restores focus after closing the camera and classifies a demo sample', async ({ page }) => {
  await page.goto('/scan');
  const shutter = page.getByRole('button', { name: 'Snap Photo' });
  await shutter.click();
  await expect(page.getByRole('dialog', { name: 'AI Waste Viewfinder' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(shutter).toBeFocused();
  await page.getByRole('button', { name: 'PET Beverage Bottle' }).click();
  await expect(page.getByRole('region', { name: 'Waste Classification Result' })).toContainText('PET');
  await checkAccessibility(page);
});

test('sets a report pin without the map and publishes from the full form', async ({ page }, testInfo) => {
  await page.goto('/complaints/new');
  const title = `Storm drain report from ${testInfo.project.name}`;
  await page.getByLabel('Upload photo from device').setInputFiles(await photo());
  await expect(page.getByRole('img', { name: 'Complaint preview' })).toBeVisible();
  await page.locator('#caption').fill(title);
  await page.getByLabel('Latitude', { exact: true }).fill('26.1741');
  await page.getByLabel('Longitude', { exact: true }).fill('91.7342');
  await page.getByRole('button', { name: 'Set pin' }).click();
  await checkAccessibility(page);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Publish Civic Complaint' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
});

test('shows environment data and labels demonstration measurements', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Environmental Intelligence Dashboard' })).toBeVisible();
  await expect(page.getByText('Environmental measurements are demonstration data')).toBeVisible();
  await expect(page.getByText('Deepor Beel', { exact: false }).first()).toBeVisible();
  await checkAccessibility(page);
});
