import {
  Alert,
  Box,
  Button,
  Card,
  Center,
  ColorInput,
  FileButton,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconAlertTriangle, IconCheck, IconPhoto, IconTrash, IconUpload } from '@tabler/icons-react'
import { useState, type FormEvent } from 'react'

import { useDeleteLogo, useMe, useUpdateProfile, useUploadLogo, type User } from '../api/auth'
import { contrastWithWhite, isHexColor, MIN_CONTRAST } from '../color'
import { DEFAULT_BRAND } from '../theme'

const SWATCHES = ['#1d4f7a', '#0f5257', '#2f4858', '#5b3a7a', '#7a1d4f', '#8a3b12', '#1f2937']
const LOGO_TYPES = 'image/png,image/jpeg,image/svg+xml'

function DisplayNameCard({ user }: { user: User }) {
  const update = useUpdateProfile()
  const [name, setName] = useState(user.display_name ?? '')

  function submit(event: FormEvent) {
    event.preventDefault()
    update.mutate({ display_name: name.trim() })
  }

  return (
    <Card>
      <form onSubmit={submit}>
        <Stack>
          <Title order={3}>Dati personali</Title>
          <TextInput label="Email" value={user.email} readOnly variant="filled" />
          <TextInput
            label="Nome visualizzato"
            description="Il tuo nome o quello dello studio, es. Studio Rossi Consulenza"
            maxLength={200}
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
          />
          {update.isError && <Alert color="red">{update.error.message}</Alert>}
          {update.isSuccess && (
            <Alert color="green" icon={<IconCheck size={16} />}>
              Nome salvato.
            </Alert>
          )}
          <Group>
            <Button type="submit" loading={update.isPending}>
              Salva
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  )
}

function LogoCard({ user }: { user: User }) {
  const upload = useUploadLogo()
  const remove = useDeleteLogo()
  const error = upload.error ?? remove.error

  return (
    <Card>
      <Stack>
        <div>
          <Title order={3}>Logo</Title>
          <Text size="sm" c="dimmed">
            Compare nell'intestazione dell'app, sulla copertina dei PDF e nelle pagine condivise con
            i clienti. PNG, JPEG o SVG, fino a 1 MB; meglio con sfondo trasparente.
          </Text>
        </div>
        <Paper withBorder bg="gray.0" h={140} p="md">
          <Center h="100%">
            {user.logo_url ? (
              <Image src={user.logo_url} alt="Logo attuale" mah={108} maw="100%" fit="contain" />
            ) : (
              <Stack gap={4} align="center" c="dimmed">
                <IconPhoto size={32} stroke={1.4} />
                <Text size="sm">Nessun logo</Text>
              </Stack>
            )}
          </Center>
        </Paper>
        {error && (
          <Alert color="red" icon={<IconAlertTriangle size={16} />}>
            {error.message}
          </Alert>
        )}
        <Group>
          <FileButton
            accept={LOGO_TYPES}
            onChange={(file) => {
              remove.reset()
              if (file) upload.mutate(file)
            }}
          >
            {(props) => (
              <Button {...props} leftSection={<IconUpload size={16} />} loading={upload.isPending}>
                {user.logo_url ? 'Sostituisci logo' : 'Carica logo'}
              </Button>
            )}
          </FileButton>
          {user.logo_url && (
            <Button
              variant="subtle"
              color="red"
              leftSection={<IconTrash size={16} />}
              loading={remove.isPending}
              onClick={() => {
                upload.reset()
                remove.mutate()
              }}
            >
              Rimuovi
            </Button>
          )}
        </Group>
      </Stack>
    </Card>
  )
}

/** How the colour will look: a button, the shared page's bar and a document title. */
function ColorPreview({ color }: { color: string }) {
  return (
    <Paper withBorder radius="md" style={{ overflow: 'hidden' }} aria-label="Anteprima del colore">
      <Box bg={color} c="white" px="md" py="sm">
        <Text size="sm" fw={600}>
          Barra della pagina condivisa
        </Text>
        <Text size="xs" opacity={0.85}>
          Documento in sola lettura
        </Text>
      </Box>
      <Stack p="md" gap="sm">
        <Text fw={650} fz="lg" c={color}>
          Fase I · Comprensione del business
        </Text>
        <Group>
          <Button color={color} size="xs">
            Pulsante
          </Button>
          <Button color={color} variant="light" size="xs">
            Secondario
          </Button>
        </Group>
      </Stack>
    </Paper>
  )
}

function ColorCard({ user }: { user: User }) {
  const update = useUpdateProfile()
  const [color, setColor] = useState(user.brand_color ?? DEFAULT_BRAND)
  const valid = isHexColor(color)
  const contrast = valid ? contrastWithWhite(color) : null
  const readable = contrast !== null && contrast >= MIN_CONTRAST
  const changed = color.toLowerCase() !== (user.brand_color ?? DEFAULT_BRAND)

  function save(value: string | null) {
    update.mutate(
      { brand_color: value ?? '' },
      { onSuccess: () => setColor(value ?? DEFAULT_BRAND) },
    )
  }

  return (
    <Card>
      <Stack>
        <div>
          <Title order={3}>Colore principale</Title>
          <Text size="sm" c="dimmed">
            Pulsanti e titoli dell'app, titoli del PDF e barra della pagina condivisa. Il testo
            sopra è bianco, quindi serve una tonalità abbastanza scura.
          </Text>
        </div>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          <div>
            <Stack gap="xs">
              <ColorInput
                label="Colore"
                format="hex"
                swatches={SWATCHES}
                swatchesPerRow={7}
                value={color}
                onChange={setColor}
                error={!valid ? 'Usa il formato #RRGGBB' : undefined}
              />
              {contrast !== null && (
                <Text size="sm" c={readable ? 'teal.8' : 'red.8'}>
                  {readable ? (
                    <>Contrasto con il bianco {contrast.toFixed(1)}:1 · leggibile</>
                  ) : (
                    <>
                      Contrasto {contrast.toFixed(1)}:1: troppo chiaro (serve almeno {MIN_CONTRAST}
                      :1)
                    </>
                  )}
                </Text>
              )}
            </Stack>
          </div>
          <div>
            <ColorPreview color={valid ? color : DEFAULT_BRAND} />
          </div>
        </SimpleGrid>
        {update.isError && <Alert color="red">{update.error.message}</Alert>}
        {update.isSuccess && !changed && (
          <Alert color="green" icon={<IconCheck size={16} />}>
            Colore salvato.
          </Alert>
        )}
        <Group>
          <Button
            onClick={() => save(color)}
            disabled={!readable || !changed}
            loading={update.isPending}
          >
            Salva colore
          </Button>
          {user.brand_color && (
            <Button variant="default" onClick={() => save(null)}>
              Ripristina il predefinito
            </Button>
          )}
        </Group>
      </Stack>
    </Card>
  )
}

export function ProfilePage() {
  const me = useMe()
  if (!me.data) return null
  return (
    <Stack gap="lg" py="xl" maw={880}>
      <div>
        <Title order={1}>Profilo e marchio</Title>
        <Text c="dimmed">
          Il tuo marchio compare sui documenti dei tuoi progetti e nelle pagine che condividi.
        </Text>
      </div>
      <DisplayNameCard user={me.data} />
      <LogoCard user={me.data} />
      <ColorCard user={me.data} />
    </Stack>
  )
}
