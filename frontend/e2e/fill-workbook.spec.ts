import { expect, test, type Page } from '@playwright/test'

import { signIn } from './user.ts'

// Every test starts signed in, through the real sign-in page.
test.beforeEach(async ({ page }) => signIn(page))

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

  // Everything is still there after a reload, shown formatted until clicked.
  await page.reload()
  const note = region.getByRole('button', { name: /^Modifica: Note e motivazione/ })
  await expect(note).toHaveText('Da confermare con lo sponsor')
  await note.click()
  await expect(region.getByRole('textbox')).toHaveValue('Da confermare con lo sponsor')
  await expect(region.getByRole('radio', { name: 'MAYBE' })).toBeChecked()

  await page.getByRole('link', { name: 'Identificazione dei pattern di AI' }).click()
  await expect(page.getByLabel('Analisi predittiva e supporto alle decisioni')).toBeChecked()

  await page.getByRole('link', { name: 'Obiettivi di business' }).first().click()
  await expect(page.getByRole('button', { name: `Modifica: ${problem}` })).toHaveText(
    'Ridurre gli abbandoni dei clienti',
  )
  await expect(page.getByText('3 di 80 domande compilate')).toBeVisible()
})

test('a phase gate suggests where to go back and keeps the decision', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Nuovo progetto' }).click()
  await page.getByLabel('Nome del progetto').fill('Prova Go/No-Go')
  await page.getByRole('button', { name: 'Crea progetto' }).click()
  await page.getByRole('link', { name: 'Iterazione 1' }).click()

  // Phase entries in the index are expandable buttons whose name includes the progress.
  await page.getByRole('button', { name: /^Fase II · Comprensione dei dati/ }).click()
  await page.getByRole('link', { name: 'Passaggio alla Fase III' }).click()

  const gate = 'Il progetto può passare alla Fase III, Preparazione dei dati?'
  const region = page.getByRole('region', { name: gate })
  // Everything but the access to data sources is in place.
  for (const checkbox of await region.getByRole('checkbox').all()) await checkbox.check()
  await region
    .getByRole('checkbox', { name: /fonti, responsabili e modalità di accesso/ })
    .uncheck()
  await expect(region.getByRole('alert', { name: /Suggerimento/ })).toContainText('NO-GO')

  await region.locator('label', { hasText: /^NO-GO$/ }).click()
  await expect(region.getByRole('combobox', { name: 'Fase a cui tornare' })).toHaveValue(
    'Fase I · Comprensione del business',
  )
  await region
    .getByRole('textbox', { name: /Note e motivazione/ })
    .fill('Accesso ai CRM da chiedere')
  await waitForSaved(page, gate)

  await page.reload()
  await expect(region.getByRole('combobox', { name: 'Fase a cui tornare' })).toHaveValue(
    'Fase I · Comprensione del business',
  )

  await page.getByRole('link', { name: 'Riepilogo Go/No-Go' }).click()
  const row = page.getByRole('row', { name: /Fase II · Comprensione dei dati/ })
  await expect(row).toContainText('NO-GO')
  await expect(row).toContainText('Accesso ai CRM da chiedere')
})

test('a table written in Markdown is formatted in the app and in the shared page', async ({
  page,
  browser,
}) => {
  await page.getByRole('button', { name: 'Nuovo progetto' }).click()
  await page.getByLabel('Nome del progetto').fill('Prova Markdown')
  await page.getByRole('button', { name: 'Crea progetto' }).click()
  await page.getByRole('link', { name: 'Iterazione 1' }).click()

  const problem = "Quale problema volete risolvere con l'AI in questa iterazione?"
  const field = page.getByRole('textbox', { name: problem })
  await field.fill('Indicatori:')
  await page
    .getByRole('toolbar', { name: `Formattazione: ${problem}` })
    .getByRole('button', {
      name: 'Tabella',
    })
    .click()
  await field.press('End')
  await waitForSaved(page, problem)

  // Leaving the field shows the table.
  await page.getByRole('heading', { name: 'Obiettivi di business', level: 2 }).click()
  const view = page.getByRole('button', { name: `Modifica: ${problem}` })
  await expect(view.getByRole('table')).toBeVisible()
  await expect(view.getByRole('columnheader', { name: 'Colonna 1' })).toBeVisible()

  // The client sees the same table.
  await page.getByRole('button', { name: 'Condividi' }).click()
  const dialog = page.getByRole('dialog', { name: 'Condividi in sola lettura' })
  await dialog.getByLabel(/Destinatario/).fill('Cliente')
  await dialog.getByRole('button', { name: 'Crea link' }).click()
  const url = await dialog.getByRole('textbox', { name: 'Link di condivisione' }).inputValue()
  const client = await browser.newContext()
  const shared = await client.newPage()
  await shared.goto(url)
  await expect(shared.getByRole('columnheader', { name: 'Colonna 2' })).toBeVisible()
  await client.close()
})
