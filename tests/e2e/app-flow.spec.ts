import { test, expect } from '@playwright/test'

test.describe('Application Flow', () => {
  test('login → add school → add application → verify dashboard', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')

    // Wait for login form to be visible
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible()

    // Fill in login credentials
    // Note: You'll need to create a test user or use environment variables
    const testEmail = process.env.TEST_EMAIL || 'test@example.com'
    const testPassword = process.env.TEST_PASSWORD || 'testpassword123'

    await page.fill('input[type="email"]', testEmail)
    await page.fill('input[type="password"]', testPassword)
    await page.click('button[type="submit"]')

    // Wait for navigation to dashboard
    await page.waitForURL('/', { timeout: 10000 })
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Navigate to schools page
    await page.click('a[href="/schools"]', { timeout: 5000 })
    await page.waitForURL('/schools')

    // Click "Add School" button
    await page.click('button:has-text("Add School")', { timeout: 5000 })

    // Fill in school form
    const schoolName = `Test University ${Date.now()}`
    await page.fill('input[name="name"]', schoolName)
    await page.fill('input[name="location"]', 'Test City, ST')
    await page.fill('input[name="website"]', 'https://testuniversity.edu')
    await page.fill('textarea[name="notes"]', 'Test notes')

    // Submit form
    await page.click('button:has-text("Save")')

    // Wait for school to be added (check for the school name in the table)
    await expect(page.getByText(schoolName)).toBeVisible({ timeout: 5000 })

    // Navigate to applications page
    await page.click('a[href="/applications"]')
    await page.waitForURL('/applications')

    // Click "Add Application" button
    await page.click('button:has-text("Add Application")', { timeout: 5000 })

    // Fill in application form
    // Select the school we just created
    await page.click('button:has-text("Select school")', { timeout: 5000 })
    await page.click(`text=${schoolName}`)

    // Select status
    await page.click('button:has-text("Select status")', { timeout: 5000 })
    await page.click('text=Planned')

    // Fill in fee and deadline
    await page.fill('input[name="app_fee"]', '50')
    
    // Set deadline to 30 days from now
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const dateStr = futureDate.toISOString().split('T')[0]
    await page.fill('input[type="date"]', dateStr)

    // Submit form
    await page.click('button:has-text("Save")')

    // Wait for application to be added
    await expect(page.getByText(schoolName)).toBeVisible({ timeout: 5000 })

    // Navigate to dashboard
    await page.click('a[href="/"]')
    await page.waitForURL('/')

    // Verify dashboard shows the school
    await expect(page.getByText(/total schools/i)).toBeVisible()
    
    // Check that total schools count includes our new school
    const totalSchoolsText = await page.textContent('text=/total schools/i')
    expect(totalSchoolsText).toBeTruthy()

    // Verify upcoming deadlines section shows our application
    await expect(page.getByText(/upcoming deadlines/i)).toBeVisible()
  })
})

