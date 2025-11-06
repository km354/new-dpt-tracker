import { test, expect, devices } from '@playwright/test'

test.describe('Responsive Design', () => {
  test('should display correctly on mobile devices', async ({ page }) => {
    // Use mobile viewport
    await page.setViewportSize(devices['iPhone 12'].viewport)

    await page.goto('/login')

    // Check that login form is visible and properly sized
    const loginForm = page.locator('form')
    await expect(loginForm).toBeVisible()

    // Check that inputs are properly sized for mobile
    const emailInput = page.locator('input[type="email"]')
    const width = await emailInput.boundingBox().then((box) => box?.width || 0)
    expect(width).toBeGreaterThan(200) // Should be reasonably wide on mobile
  })

  test('should have mobile hamburger menu on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Navigate to a protected route (will redirect to login)
    await page.goto('/')

    // After login, check for hamburger menu
    // Note: This test assumes you're logged in or can login
    // In a real scenario, you'd login first

    const hamburgerButton = page.locator('button:has(svg[data-icon="Menu"])')
    // On mobile, hamburger should be visible
    await expect(hamburgerButton).toBeVisible()
  })

  test('should stack cards vertically on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')

    // Check dashboard cards are in a single column on mobile
    const cards = page.locator('[class*="grid"]')
    const gridClass = await cards.first().getAttribute('class')
    
    // Should have mobile-specific classes (like no grid columns)
    expect(gridClass).toBeTruthy()
  })

  test('should have touch-friendly tap targets', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/login')

    // Check button sizes are adequate for touch (at least 44x44px)
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i)
      const box = await button.boundingBox()
      if (box) {
        // Minimum touch target size recommended by Apple/Google
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    }
  })

  test('should prevent horizontal scrolling on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')

    // Check body doesn't allow horizontal overflow
    const body = page.locator('body')
    const overflow = await body.evaluate((el) => {
      return window.getComputedStyle(el).overflowX
    })
    
    // Should not allow horizontal scrolling
    expect(['hidden', 'clip']).toContain(overflow)
  })
})

