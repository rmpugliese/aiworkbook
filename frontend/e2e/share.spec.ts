import { expect, test } from '@playwright/test'

import { signIn } from './user.ts'

test('a client opens a shared iteration without an account, until the link is revoked', async ({
  page,
  browser,
}) => {
  await signIn(page)
  await page.getByRole('button', { name: 'Nuovo progetto' }).click()
  await page.getByLabel('Nome del progetto').fill('Progetto condiviso')
  await page.getByLabel('Azienda cliente').fill('ACME Spa')
  await page.getByRole('button', { name: 'Crea progetto' }).click()
  await page.getByRole('link', { name: 'Iterazione 1' }).click()

  const problem = "Quale problema volete risolvere con l'AI in questa iterazione?"
  await page.getByRole('textbox', { name: problem }).fill('Ridurre i tempi di risposta')
  await expect(page.getByRole('region', { name: problem }).getByRole('status')).toHaveText(
    'Salvato',
  )

  await page.getByRole('button', { name: 'Condividi' }).click()
  const dialog = page.getByRole('dialog', { name: 'Condividi in sola lettura' })
  await dialog.getByLabel(/Destinatario/).fill('Cliente ACME')
  await dialog.getByRole('button', { name: 'Crea link' }).click()
  const url = await dialog.getByRole('textbox', { name: 'Link di condivisione' }).inputValue()
  expect(url).toMatch(/^http:\/\/localhost:5174\/s\/[\w-]{43}$/)

  // A separate browser with no session: the client.
  const client = await browser.newContext()
  const shared = await client.newPage()
  await shared.goto(url)
  await expect(shared.getByText('Documento in sola lettura', { exact: false })).toBeVisible()
  await expect(shared.getByText('Ridurre i tempi di risposta')).toBeVisible()
  await expect(shared.locator('input, textarea, form')).toHaveCount(0)
  const download = shared.waitForEvent('download')
  await shared.getByRole('link', { name: 'Scarica PDF' }).click()
  expect((await download).suggestedFilename()).toMatch(
    /^Progetto condiviso - Iterazione 1 .*\.pdf$/,
  )

  // The consultant revokes the link: the client's page is gone.
  await dialog.getByRole('button', { name: 'Fatto' }).click()
  const row = dialog.getByLabel('Link Cliente ACME')
  await row.getByRole('button', { name: 'Revoca' }).click()
  await row.getByRole('button', { name: 'Conferma revoca' }).click()
  await expect(row.getByText('Revocato', { exact: true })).toBeVisible()

  const response = await shared.reload()
  expect(response?.status()).toBe(404)
  await expect(
    shared.getByRole('heading', { name: 'Link non valido o non più disponibile' }),
  ).toBeVisible()
  await client.close()
})
