import { test, expect } from '@playwright/test';

test('should upload multiple PDF files and perform analysis', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Wait for the file chooser to appear and upload both files
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByText('Click to upload').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles([
    'RMN_Tiki_202506_OFFSITE.pdf',
    'RMN_Tiki_202507_OFFSITE.pdf'
  ]);

  // Verify that the files have been selected
  await expect(page.getByText('2 file(s) selected:')).toBeVisible();

  // Click the analyze button
  await page.getByRole('button', { name: 'Analyze Performance' }).click();

  // Wait for the analysis to complete and check for a key part of the result
  // We'll check for the "Executive Summary" section title to appear
  await expect(page.getByText('Executive Summary')).toBeVisible({ timeout: 300000 }); // Increased timeout for AI analysis
});