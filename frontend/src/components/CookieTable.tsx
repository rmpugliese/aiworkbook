import { Badge, Table, Text } from '@mantine/core'

import { COOKIES } from '../pages/legal/cookies'

export function CookieTable() {
  return (
    <Table.ScrollContainer minWidth={560}>
      <Table verticalSpacing="sm" aria-label="Cookie usati dall'app">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nome</Table.Th>
            <Table.Th>A cosa serve</Table.Th>
            <Table.Th>Durata</Table.Th>
            <Table.Th w={120}>Tipo</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {COOKIES.map((cookie) => (
            <Table.Tr key={cookie.name}>
              <Table.Td>
                <Text size="sm" ff="monospace">
                  {cookie.name}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{cookie.purpose}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{cookie.duration}</Text>
              </Table.Td>
              <Table.Td>
                <Badge color="gray">Necessario</Badge>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
