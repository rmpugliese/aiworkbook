import { Anchor, Card, Paper, Stack, Text, Title } from '@mantine/core'
import { IconExternalLink, IconHeart } from '@tabler/icons-react'

import { useDeleteOwnLogo, useUploadOwnLogo, type User } from '../api/auth'
import { useSite, type Site } from '../api/site'
import { LogoPicker } from './BrandCards'

/** The invitation to donate, when the administrator has set one. No tracking: a plain link. */
function DonationInvitation({ donation }: { donation: NonNullable<Site['donation']> }) {
  return (
    <Paper withBorder radius="md" p="md" bg="gray.0">
      <Stack gap="xs">
        <Text size="sm" fw={600} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconHeart size={16} stroke={1.6} aria-hidden />
          Una donazione spontanea, se vuoi
        </Text>
        <Text size="sm" style={{ whiteSpace: 'pre-line' }}>
          {donation.text}
        </Text>
        <Anchor
          href={donation.url}
          target="_blank"
          rel="noopener noreferrer"
          size="sm"
          fw={600}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          Sostieni l'associazione
          <IconExternalLink size={14} aria-hidden />
        </Anchor>
      </Stack>
    </Paper>
  )
}

/** The user's own logo: on the cover of the PDFs they download, nowhere else. */
export function OwnLogoCard({ user }: { user: User }) {
  const upload = useUploadOwnLogo()
  const remove = useDeleteOwnLogo()
  const donation = useSite().data?.donation

  return (
    <Card>
      <Stack>
        <div>
          <Title order={3}>Il tuo logo nei PDF</Title>
          <Text size="sm" c="dimmed">
            Compare sulla copertina dei PDF che scarichi tu, al posto del logo del sito. L'app e le
            pagine condivise con i clienti restano invariate. PNG, JPEG o SVG, fino a 1 MB; meglio
            con sfondo trasparente.
          </Text>
        </div>
        <LogoPicker
          logoUrl={user.logo_url}
          upload={upload}
          remove={remove}
          onUpload={(file) => upload.mutate(file)}
          onRemove={() => remove.mutate()}
        />
        {donation && <DonationInvitation donation={donation} />}
      </Stack>
    </Card>
  )
}
