import {
  ActionIcon,
  Box,
  Group,
  Input,
  Popover,
  Stack,
  Text,
  Textarea,
  Tooltip,
} from '@mantine/core'
import {
  IconBold,
  IconHelp,
  IconItalic,
  IconList,
  IconListNumbers,
  IconPencil,
  IconTable,
} from '@tabler/icons-react'
import { useEffect, useRef, useState, type FocusEvent, type ReactNode } from 'react'

import { Markdown } from './Markdown'
import { applyFormat, type FormatAction } from './markdownEditing'

const TOOLS: { action: FormatAction; label: string; icon: ReactNode }[] = [
  { action: 'bold', label: 'Grassetto', icon: <IconBold size={16} /> },
  { action: 'italic', label: 'Corsivo', icon: <IconItalic size={16} /> },
  { action: 'bullets', label: 'Elenco puntato', icon: <IconList size={16} /> },
  { action: 'numbers', label: 'Elenco numerato', icon: <IconListNumbers size={16} /> },
  { action: 'table', label: 'Tabella', icon: <IconTable size={16} /> },
]

function Guide() {
  return (
    <Popover width={300} position="bottom-end" withArrow shadow="md" withinPortal={false}>
      <Popover.Target>
        <Tooltip label="Guida alla formattazione">
          <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Guida alla formattazione">
            <IconHelp size={16} />
          </ActionIcon>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap={6}>
          <Text size="sm" fw={600}>
            Formattazione (Markdown)
          </Text>
          <Text size="xs">
            <code>**grassetto**</code> · <code>*corsivo*</code>
          </Text>
          <Text size="xs">
            <code>- voce</code> per un elenco, <code>1. voce</code> per un elenco numerato
          </Text>
          <Text size="xs">
            Tabella: <code>| A | B |</code>, poi <code>| --- | --- |</code>, poi una riga per volta
          </Text>
          <Text size="xs">
            Link: <code>[testo](https://…)</code> · una riga vuota separa i paragrafi
          </Text>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}

type Props = {
  value: string
  onChange: (value: string) => void
  /** The accessible name of the text area; also names the "edit" control. */
  ariaLabel: string
  label?: string
  description?: string
  placeholder?: string
  minRows?: number
  error?: ReactNode
}

/**
 * A Markdown answer: shown formatted, edited as text with a small toolbar. A filled-in field
 * opens formatted; a click (or Enter) edits it, and leaving it shows the result again.
 */
export function MarkdownField({
  value,
  onChange,
  ariaLabel,
  label,
  description,
  placeholder,
  minRows = 3,
  error,
}: Props) {
  const [editing, setEditing] = useState(() => !value.trim())
  const [focusOnEdit, setFocusOnEdit] = useState(false)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const editor = useRef<HTMLDivElement>(null)

  // Text that arrives from outside while nobody is typing here (the assistant's "Sostituisci"
  // or "Aggiungi in fondo") is shown formatted straight away.
  useEffect(() => {
    // Only a change of text triggers this: entering edit mode must not leave it again.
    const focused = editor.current?.contains(document.activeElement)
    if (value.trim() && !focused) setEditing(false)
  }, [value])

  function format(action: FormatAction) {
    const element = textarea.current
    if (!element) return
    const edit = applyFormat(action, value, element.selectionStart, element.selectionEnd)
    onChange(edit.text)
    requestAnimationFrame(() => {
      element.focus()
      element.setSelectionRange(edit.start, edit.end)
    })
  }

  function leave(event: FocusEvent<HTMLDivElement>) {
    // Moving to the toolbar or the guide stays in the field; anywhere else shows the result.
    const next = event.relatedTarget as Node | null
    if (next && event.currentTarget.contains(next)) return
    if (value.trim()) setEditing(false)
  }

  function startEditing() {
    setFocusOnEdit(true)
    setEditing(true)
  }

  return (
    <Input.Wrapper label={label} description={description} error={error}>
      {editing ? (
        <Box onBlur={leave} ref={editor}>
          <Group
            gap={2}
            justify="space-between"
            px={4}
            py={2}
            role="toolbar"
            aria-label={`Formattazione: ${ariaLabel}`}
          >
            <Group gap={2}>
              {TOOLS.map((tool) => (
                <Tooltip key={tool.action} label={tool.label}>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    aria-label={tool.label}
                    // Keep the cursor where it is in the text area.
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => format(tool.action)}
                  >
                    {tool.icon}
                  </ActionIcon>
                </Tooltip>
              ))}
            </Group>
            <Guide />
          </Group>
          <Textarea
            ref={textarea}
            aria-label={ariaLabel}
            placeholder={placeholder}
            autosize
            minRows={minRows}
            value={value}
            error={Boolean(error)}
            autoFocus={focusOnEdit}
            onChange={(event) => onChange(event.currentTarget.value)}
          />
        </Box>
      ) : (
        // A div rather than a <button>: the formatted answer contains tables and links.
        <div
          role="button"
          tabIndex={0}
          aria-label={`Modifica: ${ariaLabel}`}
          className="markdown-view"
          onClick={(event) => {
            // Links in the answer open normally instead of switching to editing.
            if ((event.target as Element).closest('a')) return
            startEditing()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              startEditing()
            }
          }}
        >
          <Markdown text={value} />
          <IconPencil size={14} className="markdown-view-pencil" aria-hidden />
        </div>
      )}
    </Input.Wrapper>
  )
}
