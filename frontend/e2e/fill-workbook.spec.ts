import { expect, test, type Page } from '@playwright/test'

async function waitForSaved(page: Page, question: string) {
  await expect(page.getByRole('region', { name: question }).getByRole('status')).toHaveText(
    'Salvato',
  )
}

test('answers survive a page reload', async ({ page }) => {
  // Create a project from the dashboard.
  await page.goto('/')
  await page.getByRole('button', { name: 'Nuovo progetto' }).click()
  await page.getByLabel('Nome del progetto').fill('Prova end-to-end')
  await page.getByLabel('Azienda cliente').fill('ACME Spa')
  await page.getByRole('button', { name: 'Crea progetto' }).click()
  await page.getByRole('link', { name: 'Iterazione 1' }).click()

  // A text answer in the first task.
  const problem = "Quale problema volete risolvere con l'AI in questa iterazione?"
  await page.getByRole('textbox', { name: problem }).fill('Ridurre gli abbandoni dei clienti')
  await waitForSaved(page, problem)

  // An AI pattern.
  await page.getByRole('link', { name: 'Identificazione dei pattern di AI' }).click()
  const patterns = 'Quali pattern di AI state implementando in questa iterazione?'
  await page.getByLabel('Analisi predittiva e supporto alle decisioni').check()
  await waitForSaved(page, patterns)

  // A Go/No-Go factor.
  await page.getByRole('link', { name: 'Fattibilità di business' }).click()
  const factor = 'Il problema è descritto in modo chiaro rispetto agli obiettivi di business?'
  const region = page.getByRole('region', { name: factor })
  await region.getByText('MAYBE').click()
  await region.getByRole('textbox').fill('Da confermare con lo sponsor')
  await waitForSaved(page, factor)

  // Everything is still there after a reload.
  await page.reload()
  await expect(region.getByRole('textbox')).toHaveValue('Da confermare con lo sponsor')
  await expect(region.getByRole('radio', { name: 'MAYBE' })).toBeChecked()

  await page.getByRole('link', { name: 'Identificazione dei pattern di AI' }).click()
  await expect(page.getByLabel('Analisi predittiva e supporto alle decisioni')).toBeChecked()

  await page.getByRole('link', { name: 'Obiettivi di business' }).first().click()
  await expect(page.getByRole('textbox', { name: problem })).toHaveValue(
    'Ridurre gli abbandoni dei clienti',
  )
  await expect(page.getByText('3 di 80 domande compilate')).toBeVisible()
})
