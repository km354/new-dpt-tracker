import { test, expect } from '@playwright/test'
import { playAudit } from 'playwright-lighthouse'
import { chromium } from 'playwright'

test.describe('Lighthouse Performance', () => {
  test('should achieve Lighthouse score > 90', async () => {
    const browser = await chromium.launch({
      args: ['--remote-debugging-port=9222'],
    })

    const page = await browser.newPage()
    await page.goto('http://localhost:5173')

    try {
      await playAudit({
        page,
        thresholds: {
          performance: 90,
          accessibility: 90,
          'best-practices': 90,
          seo: 90,
        },
        port: 9222,
      })

      // If we get here, all thresholds were met
      expect(true).toBe(true)
    } catch (error) {
      // If thresholds weren't met, fail the test
      throw new Error(`Lighthouse scores did not meet thresholds: ${error}`)
    } finally {
      await browser.close()
    }
  })
})

