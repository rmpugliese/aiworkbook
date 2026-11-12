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
  Title,
} from '@mantine/core'
import { IconAlertTriangle, IconCheck, IconPhoto, IconTrash, IconUpload } from '@tabler/icons-react'
import { useState } from 'react'

import {
  useDeleteSiteLogo,
  useSite,
  useUpdateBrandColor,
  useUploadSiteLogo,
  type Site,
} from '../api/site'
import { contrastWithWhite, isHexColor, MIN_CONTRAST } from '../color'
import { DEFAULT_BRAND } from '../theme'

const SWATCHES = ['#1d4f7a', '#0f5257', '#2f4858', '#5b3a7a', '#7a1d4f', '#8a3b12', '#1f2937']
const LOGO_TYPES = 'image/png,image/jpeg,image/svg+xml'

type LogoMutation = {
  isPending: boolean
  error: Error | null
  reset: () => void
}

/** Preview, upload and removal of a logo: the site's or a user's own. */
export function LogoPicker({
  logoUrl,
  upload,
  remove,
  onUpload,
  onRemove,
}: {
  logoUrl: string | null
  upload: LogoMutation
  remove: LogoMutation
  onUpload: (file: File) => void
  onRemove: () => void
}) {
  const error = upload.error ?? remove.error
  return (
    <>
      <Paper withBorder bg="gray.0" h={140} p="md">
        <Center h="100%">
          {logoUrl ? (
            <Image src={logoUrl} alt="Logo attuale" mah={108} maw="100%" fit="contain" />
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
            if (file) onUpload(file)
          }}
        >
          {(props) => (
            <Button {...props} leftSection={<IconUpload size={16} />} loading={upload.isPending}>
              {logoUrl ? 'Sostituisci logo' : 'Carica logo'}
            </Button>
          )}
        </FileButton>
        {logoUrl && (
          <Button
            variant="subtle"
            color="red"
            leftSection={<IconTrash size={16} />}
            loading={remove.isPending}
            onClick={() => {
              upload.reset()
              onRemove()
            }}
          >
            Rimuovi
          </Button>
        )}
      </Group>
    </>
  )
}

function LogoCard({ site }: { site: Site }) {
  const upload = useUploadSiteLogo()
  const remove = useDeleteSiteLogo()

  return (
    <Card>
      <Stack>
        <div>
          <Title order={3}>Logo</Title>
          <Text size="sm" c="dimmed">
            Il marchio dell'installazione: nell'intestazione dell'app per tutti gli utenti, nella
            pagina di accesso, nelle pagine condivise con i clienti e sulla copertina dei PDF di chi
            non ha caricato un proprio logo. PNG, JPEG o SVG, fino a 1 MB; meglio con sfondo
            trasparente.
          </Text>
        </div>
        <LogoPicker
          logoUrl={site.logo_url}
          upload={upload}
          remove={remove}
          onUpload={(file) => upload.mutate(file)}
          onRemove={() => remove.mutate()}
        />
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

function ColorCard({ site }: { site: Site }) {
  const update = useUpdateBrandColor()
  const [color, setColor] = useState(site.brand_color ?? DEFAULT_BRAND)
  const valid = isHexColor(color)
  const contrast = valid ? contrastWithWhite(color) : null
  const readable = contrast !== null && contrast >= MIN_CONTRAST
  const changed = color.toLowerCase() !== (site.brand_color ?? DEFAULT_BRAND)

  function save(value: string | null) {
    update.mutate(value, { onSuccess: () => setColor(value ?? DEFAULT_BRAND) })
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
          {site.brand_color && (
            <Button variant="default" onClick={() => save(null)}>
              Ripristina il predefinito
            </Button>
          )}
        </Group>
      </Stack>
    </Card>
  )
}

/** The installation's brand, in the administration page. */
export function BrandCards() {
  const site = useSite()
  if (!site.data) return null
  return (
    <>
      <LogoCard site={site.data} />
      <ColorCard site={site.data} />
    </>
  )
}
