import { Alert, Button, FileInput, Group, Modal, Stack, Text, TextInput } from '@mantine/core'
import { IconFileTypePdf } from '@tabler/icons-react'
import { useState, type FormEvent } from 'react'

import { useImportWorkbookPdf, type WorkbookPdfImportResult } from '../api/projects'
import { readPdfFields } from '../pdfImport/readFields'

type Props = {
  opened: boolean
  onClose: () => void
  onImported: (result: WorkbookPdfImportResult) => void
}

/** "Workbook_Velaria.pdf" → "Workbook Velaria". */
function nameFromFile(file: File): string {
  return file.name
    .replace(/\.pdf$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .slice(0, 200)
}

/** A new project from a fillable workbook PDF. Remount it (via `key`) to reset the fields. */
export function WorkbookPdfImportModal({ opened, onClose, onImported }: Props) {
  const importPdf = useImportWorkbookPdf()
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [reading, setReading] = useState(false)
  const [readError, setReadError] = useState<string | null>(null)
  const error = readError ?? importPdf.error?.message

  function choose(chosen: File | null) {
    setFile(chosen)
    setReadError(null)
    importPdf.reset()
    if (chosen && !name.trim()) setName(nameFromFile(chosen))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!file) return
    setReadError(null)
    setReading(true)
    let fields
    try {
      fields = await readPdfFields(file)
    } catch (caught) {
      setReadError(caught instanceof Error ? caught.message : 'Il PDF non si può leggere.')
      return
    } finally {
      setReading(false)
    }
    importPdf.mutate({ name, client_name: clientName || null, fields }, { onSuccess: onImported })
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Importa da workbook PDF">
      <form onSubmit={submit}>
        <Stack>
          <Text size="sm" c="dimmed">
            Scegli il workbook PDF compilabile in cui hai già scritto le risposte: si crea un
            progetto nuovo con l'iterazione 1 compilata. Il PDF viene letto qui nel browser e non
            viene inviato né salvato: al server arrivano solo i testi dei campi.
          </Text>
          <FileInput
            label="Workbook PDF"
            placeholder="Scegli il file"
            accept="application/pdf,.pdf"
            required
            clearable
            leftSection={<IconFileTypePdf size={16} />}
            value={file}
            onChange={choose}
          />
          <TextInput
            label="Nome del progetto"
            required
            maxLength={200}
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
          />
          <TextInput
            label="Azienda cliente"
            maxLength={200}
            value={clientName}
            onChange={(event) => setClientName(event.currentTarget.value)}
          />
          {error && (
            <Alert color="red" title="Importazione non riuscita">
              {error}
            </Alert>
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Annulla
            </Button>
            <Button
              type="submit"
              loading={reading || importPdf.isPending}
              disabled={!file || !name.trim()}
            >
              Importa
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
