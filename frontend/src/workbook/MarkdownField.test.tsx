import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { MarkdownField } from './MarkdownField'

function Harness({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial)
  return (
    <MantineProvider>
      <MarkdownField ariaLabel="Risposta" value={value} onChange={setValue} />
      <button type="button">Altrove</button>
      {/* Like the assistant's "Sostituisci": the text changes from outside the field. */}
      <button type="button" onClick={() => setValue('- **uno**\n- due')}>
        Sostituisci
      </button>
      <output data-testid="value">{value}</output>
    </MantineProvider>
  )
}

const TABLE = '| KPI | Obiettivo |\n|---|---|\n| Chiamate | -40% |'

describe('MarkdownField', () => {
  it('shows a filled-in answer formatted and edits it on click', async () => {
    render(<Harness initial={`**Obiettivo**\n- uno\n\n${TABLE}`} />)
    const view = screen.getByRole('button', { name: 'Modifica: Risposta' })
    expect(view.querySelector('strong')?.textContent).toBe('Obiettivo')
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Risposta' })).toBeNull()

    await userEvent.click(view)
    const textarea = screen.getByRole('textbox', { name: 'Risposta' })
    expect(textarea).toHaveFocus()
    expect(textarea).toHaveValue(`**Obiettivo**\n- uno\n\n${TABLE}`)

    await userEvent.click(screen.getByRole('button', { name: 'Altrove' }))
    expect(screen.getByRole('button', { name: 'Modifica: Risposta' })).toBeInTheDocument()
  })

  it('opens with the keyboard', async () => {
    render(<Harness initial="testo" />)
    screen.getByRole('button', { name: 'Modifica: Risposta' }).focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('textbox', { name: 'Risposta' })).toHaveFocus()
  })

  it('starts in editing when empty, and the toolbar keeps the field open', async () => {
    render(<Harness initial="" />)
    const textarea = screen.getByRole('textbox', { name: 'Risposta' })
    await userEvent.type(textarea, 'Rischi')
    await userEvent.click(screen.getByRole('button', { name: 'Elenco puntato' }))
    await userEvent.click(screen.getByRole('button', { name: 'Tabella' }))
    expect(screen.getByTestId('value').textContent).toBe(
      '- Rischi\n\n| Colonna 1 | Colonna 2 | Colonna 3 |\n| --- | --- | --- |\n|  |  |  |',
    )
    expect(screen.getByRole('textbox', { name: 'Risposta' })).toBeInTheDocument()
  })

  it('shows text applied from outside formatted, even if the field was empty', async () => {
    render(<Harness initial="" />)
    expect(screen.getByRole('textbox', { name: 'Risposta' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Sostituisci' }))

    const view = screen.getByRole('button', { name: 'Modifica: Risposta' })
    expect(view.querySelectorAll('li')).toHaveLength(2)
    expect(view.querySelector('strong')?.textContent).toBe('uno')
    expect(screen.queryByRole('textbox', { name: 'Risposta' })).toBeNull()
  })

  it('never renders HTML or javascript links', () => {
    render(
      <Harness initial={'<b>html</b> <img src=x onerror="alert(1)"> [x](javascript:alert(1))'} />,
    )
    const view = screen.getByRole('button', { name: 'Modifica: Risposta' })
    expect(view.querySelector('b, img, script')).toBeNull()
    expect(view.querySelector('a')?.getAttribute('href') ?? '').not.toMatch(/javascript/)
  })

  it('keeps single line breaks', () => {
    render(<Harness initial={'prima\nseconda'} />)
    expect(
      screen.getByRole('button', { name: 'Modifica: Risposta' }).querySelector('br'),
    ).not.toBeNull()
  })
})
