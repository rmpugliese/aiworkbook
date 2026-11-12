import {
  Alert,
  Button,
  Card,
  Group,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { IconCheck } from '@tabler/icons-react'
import { useState, type FormEvent } from 'react'

import { useDonationSettings, useUpdateDonation, type DonationSettings } from '../api/site'

export const DONATION_TEXT_LIMIT = 600

const SUGGESTED_TEXT =
  "Il logo personale è gratuito. Se l'app ti è utile, puoi sostenere con una donazione " +
  'spontanea Glioblastoma.IT ODV, che aiuta i pazienti con glioblastoma e le loro famiglie. ' +
  "Chi ha creato AI Project Workbook presiede l'associazione."
const SUGGESTED_URL = 'https://www.glioblastomamultiforme.it/contributi/'

function DonationForm({ settings }: { settings: DonationSettings }) {
  const update = useUpdateDonation()
  const [values, setValues] = useState(settings)
  const empty = !values.text.trim() && !values.url.trim()

  function submit(event: FormEvent) {
    event.preventDefault()
    update.mutate(values)
  }

  return (
    <form onSubmit={submit}>
      <Stack>
        <Switch
          label="Mostra l'invito nel profilo"
          description="Compare solo se ci sono sia il testo sia il link."
          checked={values.enabled}
          onChange={(event) => setValues({ ...values, enabled: event.currentTarget.checked })}
        />
        <Textarea
          label="Testo"
          description={`${values.text.length}/${DONATION_TEXT_LIMIT}`}
          placeholder={SUGGESTED_TEXT}
          autosize
          minRows={3}
          maxLength={DONATION_TEXT_LIMIT}
          value={values.text}
          onChange={(event) => setValues({ ...values, text: event.currentTarget.value })}
        />
        <TextInput
          label="Link"
          description="La pagina per donare; deve iniziare con https://"
          placeholder={SUGGESTED_URL}
          value={values.url}
          onChange={(event) => setValues({ ...values, url: event.currentTarget.value })}
        />
        {update.isError && <Alert color="red">{update.error.message}</Alert>}
        {update.isSuccess && (
          <Alert color="green" icon={<IconCheck size={16} />}>
            Invito salvato.
          </Alert>
        )}
        <Group>
          <Button type="submit" loading={update.isPending}>
            Salva
          </Button>
          {empty && (
            <Button
              variant="default"
              onClick={() => setValues({ ...values, text: SUGGESTED_TEXT, url: SUGGESTED_URL })}
            >
              Usa il testo proposto
            </Button>
          )}
        </Group>
      </Stack>
    </form>
  )
}

/** An optional invitation to donate to an organisation, shown in every user's profile. */
export function DonationCard() {
  const settings = useDonationSettings()
  return (
    <Card>
      <Stack gap="xs" mb="md">
        <Title order={3}>Invito a una donazione</Title>
        <Text size="sm" c="dimmed">
          Un riquadro discreto nel profilo, accanto al logo personale. La donazione è spontanea:
          nessuna funzione dipende da questo, e l'app non registra chi clicca o dona.
        </Text>
      </Stack>
      {settings.data && <DonationForm settings={settings.data} />}
    </Card>
  )
}
