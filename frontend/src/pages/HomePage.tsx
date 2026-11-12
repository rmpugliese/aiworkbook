import {
  Anchor,
  Badge,
  Box,
  Button,
  Group,
  Image,
  List,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconFileTypePdf,
  IconLock,
  IconMessageChatbot,
  IconShare,
  IconUsers,
} from '@tabler/icons-react'
import { Link } from 'react-router'

import { useSite } from '../api/site'

import assistente from '../assets/home/assistente.webp'
import collaborazione from '../assets/home/collaborazione.webp'
import compilazione from '../assets/home/compilazione.webp'
import condivisione from '../assets/home/condivisione.webp'
import goNoGo from '../assets/home/go-no-go.webp'
import importPdf from '../assets/home/import-pdf.webp'
import pdf from '../assets/home/pdf.webp'
import presentazione from '../assets/home/presentazione.mp4'
import videoPoster from '../assets/home/video-poster.webp'

type Feature = { kicker: string; title: string; text: string; image: string; alt: string }

const FEATURES: Feature[] = [
  {
    kicker: 'Compilazione guidata',
    title: 'Fase per fase, domanda per domanda',
    text: 'Tutte le fasi del workbook, con una guida per ogni domanda, salvataggio automatico, elenchi e tabelle. Più progetti, e per ogni progetto più iterazioni.',
    image: compilazione,
    alt: "Una domanda del workbook con una tabella di misure compilata e l'elenco delle fasi",
  },
  {
    kicker: 'Decisioni',
    title: 'Go/No-Go sempre sotto controllo',
    text: "I nove fattori di fattibilità e l'esito di ogni fase in un colpo d'occhio, con la motivazione delle decisioni.",
    image: goNoGo,
    alt: 'Il riepilogo Go/No-Go con i fattori di fattibilità e la tabella degli esiti delle fasi',
  },
  {
    kicker: 'Assistente AI',
    title: 'Un assistente che lavora solo quando lo chiedi',
    text: 'Propone una bozza, migliora un testo o fa domande critiche, seguendo le tue indicazioni su tono, contenuto e lunghezza. Ogni proposta va accettata da te.',
    image: assistente,
    alt: "Il riquadro dell'assistente con le indicazioni e una bozza proposta",
  },
  {
    kicker: 'Condivisione',
    title: 'Il cliente vede tutto, senza account',
    text: 'Un link in sola lettura, sempre aggiornato, revocabile quando vuoi.',
    image: condivisione,
    alt: 'La pagina in sola lettura che vede il cliente',
  },
  {
    kicker: 'Documento',
    title: 'Un PDF pronto da consegnare, con il tuo logo',
    text: 'Il riepilogo Go/No-Go e tutte le risposte, pronto da inviare al cliente. Carica il tuo logo nel profilo e lo trovi in copertina.',
    image: pdf,
    alt: 'La copertina e una pagina del PDF generato',
  },
  {
    kicker: 'Import dal PDF',
    title: 'Hai già compilato il workbook? Riparti da lì',
    text: 'Le risposte del workbook PDF compilabile diventano un progetto. Il file viene letto nel tuo browser e non lascia il computer.',
    image: importPdf,
    alt: "La finestra di import dal workbook PDF e l'avviso delle risposte importate",
  },
  {
    kicker: 'Collaborazione',
    title: 'Il progetto, insieme ai colleghi',
    text: "Fino a 5 collaboratori invitati per email. Su ogni risposta vedi chi l'ha modificata, e se due persone la cambiano insieme l'app ti avvisa.",
    image: collaborazione,
    alt: 'Una risposta modificata da un collega e il riquadro dei collaboratori',
  },
]

const HIGHLIGHTS = [
  { icon: IconLock, text: 'Dati in Europa, solo cookie tecnici' },
  { icon: IconMessageChatbot, text: 'Assistente AI facoltativo, attivato da te per ogni progetto' },
  { icon: IconShare, text: 'Link in sola lettura per il cliente' },
  { icon: IconFileTypePdf, text: 'PDF con il tuo logo' },
  { icon: IconUsers, text: 'Fino a 5 colleghi per progetto' },
]

function SignUpButtons() {
  return (
    <Group gap="sm">
      <Button component={Link} to="/register" size="md">
        Registrati gratis
      </Button>
      <Button component={Link} to="/login" size="md" variant="default">
        Accedi
      </Button>
    </Group>
  )
}

function FeatureRow({ feature, flip }: { feature: Feature; flip: boolean }) {
  const text = (
    <Stack gap="xs" justify="center">
      <Text size="sm" fw={700} tt="uppercase" c="brand.7" style={{ letterSpacing: '0.06em' }}>
        {feature.kicker}
      </Text>
      <Title order={2}>{feature.title}</Title>
      <Text c="dimmed" size="lg">
        {feature.text}
      </Text>
    </Stack>
  )
  const image = (
    <Paper withBorder radius="md" shadow="sm" style={{ overflow: 'hidden' }}>
      <Image src={feature.image} alt={feature.alt} loading="lazy" />
    </Paper>
  )
  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing={48} verticalSpacing="lg">
      {/* On a phone the text always comes first. */}
      <Box style={{ order: flip ? 2 : 1 }}>{text}</Box>
      <Box style={{ order: flip ? 1 : 2 }} visibleFrom="md">
        {image}
      </Box>
      <Box hiddenFrom="md">{image}</Box>
    </SimpleGrid>
  )
}

/** What a visitor sees before signing in: what the app does, and a way in. */
export function HomePage() {
  const contactEmail = useSite().data?.legal.contact_email
  return (
    <Stack gap={80} py={48}>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing={48} verticalSpacing="xl">
        <Stack gap="lg" justify="center">
          <Badge variant="light" size="lg" w="fit-content">
            Gratuito · in continua evoluzione
          </Badge>
          <Title order={1} fz={{ base: 36, sm: 48 }} lh={1.1}>
            Il workbook CPMAI, finalmente digitale
          </Title>
          <Text size="xl" c="dimmed">
            Un'app web per documentare i progetti di intelligenza artificiale, fase per fase, dalla
            prima idea al Go/No-Go. Per consulenti e project manager.
          </Text>
          <SignUpButtons />
          <List spacing={6} size="sm" c="dimmed">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <List.Item
                key={text}
                icon={
                  <ThemeIcon size={22} radius="xl" variant="light">
                    <Icon size={14} />
                  </ThemeIcon>
                }
              >
                {text}
              </List.Item>
            ))}
          </List>
        </Stack>
        <Paper
          withBorder
          radius="lg"
          shadow="md"
          maw={420}
          mx="auto"
          w="100%"
          style={{ overflow: 'hidden' }}
        >
          <video
            src={presentazione}
            poster={videoPoster}
            controls
            muted
            playsInline
            preload="none"
            aria-label="Video di presentazione di AI Project Workbook, senza audio"
            style={{ display: 'block', width: '100%', aspectRatio: '4 / 5' }}
          />
        </Paper>
      </SimpleGrid>

      {FEATURES.map((feature, index) => (
        <FeatureRow key={feature.kicker} feature={feature} flip={index % 2 === 1} />
      ))}

      <Paper withBorder radius="lg" p={{ base: 'lg', sm: 40 }} bg="white">
        <Stack gap="md" align="flex-start">
          <Title order={2}>Provalo e dimmi cosa ne pensi</Title>
          <Text c="dimmed" size="lg" maw={720}>
            È gratuito e cresce con chi lo usa: i tuoi suggerimenti decidono le prossime funzioni.
            Per iniziare bastano un'email e una password.
          </Text>
          <SignUpButtons />
          {contactEmail && (
            <Text size="sm">
              Hai domande? Scrivi a{' '}
              <Anchor href={`mailto:${contactEmail}`} fw={600}>
                {contactEmail}
              </Anchor>
            </Text>
          )}
          <Text size="xs" c="dimmed">
            Compatibile con la metodologia CPMAI; non affiliato né approvato da PMI.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  )
}
