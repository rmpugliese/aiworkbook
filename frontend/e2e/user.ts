import { expect, type Page } from '@playwright/test'

// The confirmed user the e2e backend creates on start-up (see playwright.config.ts).
export const E2E_USER = { email: 'e2e@example.com', password: 'password-e2e-lunga' }

/** Signs in through the real sign-in page. */
export async function signIn(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Accedi' })).toBeVisible()
  await page.getByLabel(/^Email/).fill(E2E_USER.email)
  await page.getByLabel(/^Password/).fill(E2E_USER.password)
  await page.getByRole('button', { name: 'Accedi' }).click()
  await expect(page.getByRole('heading', { name: 'Progetti' })).toBeVisible()
}
