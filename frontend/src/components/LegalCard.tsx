import {
  Alert,
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconAlertTriangle, IconCheck } from '@tabler/icons-react'
import { useState, type FormEvent } from 'react'

import { useSite, useUpdateLegal, type Site } from '../api/site'

function LegalForm({ site }: { site: Site }) {
  const update = useUpdateLegal()
  const [values, setValues] = useState({
    name: site.legal.name,
    address: site.legal.address,
    vat_id: site.legal.vat_id,
    email: site.legal.email,
    pec: site.legal.pec,
    court: site.legal.court,
    reviewed: site.legal.reviewed,
  })
  const field = (key: keyof typeof values) => ({
    value: values[key] as string,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues({ ...values, [key]: event.currentTarget.value }),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    update.mutate(values)
  }

  return (
    <form onSubmit={submit}>
      <Stack>
        {!site.legal.complete && (
          <Alert color="yellow" icon={<IconAlertTriangle size={16} />}>
            Mancano dati essenziali (titolare, indirizzo, email per la privacy): le pagine legali
            mostrano dei segnaposto.
          </Alert>
        )}
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="Titolare del trattamento"
            description="Ragione sociale o nome e cognome"
            required
            {...field('name')}
          />
          <TextInput label="Partita IVA o codice fiscale" {...field('vat_id')} />
        </SimpleGrid>
        <TextInput
          label="Indirizzo"
          description="Sede legale: via, CAP, città"
          required
          {...field('address')}
        />
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput label="Email per la privacy" type="email" required {...field('email')} />
          <TextInput label="PEC" type="email" description="Facoltativa" {...field('pec')} />
        </SimpleGrid>
        <TextInput
          label="Foro competente"
          description="Per i termini d'uso, es. Trieste"
          {...field('court')}
        />
        <Switch
          label="Testi rivisti da un legale"
          description="Togli l'avviso «Bozza» dalle pagine legali solo dopo la revisione."
          checked={values.reviewed}
          onChange={(event) => setValues({ ...values, reviewed: event.currentTarget.checked })}
        />
        {update.isError && <Alert color="red">{update.error.message}</Alert>}
        {update.isSuccess && (
          <Alert color="green" icon={<IconCheck size={16} />}>
            Dati legali salvati.
          </Alert>
        )}
        <Group>
          <Button type="submit" loading={update.isPending}>
            Salva
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

/** The data controller shown in the privacy notice and the terms of use. */
export function LegalCard() {
  const site = useSite()
  return (
    <Card>
      <Stack gap="xs" mb="md">
        <Title order={3}>Dati legali</Title>
        <Text size="sm" c="dimmed">
          Compaiono nell'informativa privacy, nella cookie policy e nei termini d'uso.
        </Text>
      </Stack>
      {site.data && <LegalForm site={site.data} />}
    </Card>
  )
}
