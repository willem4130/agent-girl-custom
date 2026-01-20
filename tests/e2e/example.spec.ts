import { test, expect } from '@playwright/test'

test('homepage has correct title and content', async ({ page }) => {
  await page.goto('/')

  // Check main heading
  await expect(page.getByRole('heading', { name: /Build Your Next Project Faster/i })).toBeVisible()

  // Check template name
  await expect(page.getByText(/Next.js Fullstack Template/i)).toBeVisible()
})

test('dashboard page is accessible', async ({ page }) => {
  await page.goto('/dashboard')

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})
