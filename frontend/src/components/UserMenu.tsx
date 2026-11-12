import { Avatar, Group, Menu, Text, UnstyledButton } from '@mantine/core'
import {
  IconBulb,
  IconChevronDown,
  IconLogout,
  IconShieldLock,
  IconUserCircle,
} from '@tabler/icons-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { useLogout, useMe } from '../api/auth'
import { useSite } from '../api/site'
import { FeedbackModal } from './FeedbackModal'

function initials(label: string): string {
  const words = label
    .replace(/@.*/, '')
    .split(/[\s._-]+/)
    .filter(Boolean)
  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

export function UserMenu() {
  const me = useMe()
  const logout = useLogout()
  const navigate = useNavigate()
  const canSuggest = Boolean(useSite().data?.legal.contact_email)
  const [suggesting, setSuggesting] = useState(false)

  if (!me.data) return null
  const label = me.data.display_name ?? me.data.email

  return (
    <>
      <Menu position="bottom-end" withinPortal width={240}>
        <Menu.Target>
          <UnstyledButton aria-label={`Menu di ${label}`}>
            <Group gap="xs" wrap="nowrap">
              <Avatar color="brand" radius="xl" size={32}>
                {initials(label)}
              </Avatar>
              <Text size="sm" fw={500} visibleFrom="sm" maw={200} truncate>
                {label}
              </Text>
              <IconChevronDown size={14} stroke={1.8} />
            </Group>
          </UnstyledButton>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>
            <Text size="xs" truncate>
              {me.data.email}
            </Text>
          </Menu.Label>
          <Menu.Item component={Link} to="/profile" leftSection={<IconUserCircle size={16} />}>
            Profilo
          </Menu.Item>
          {me.data.is_admin && (
            <Menu.Item component={Link} to="/admin" leftSection={<IconShieldLock size={16} />}>
              Amministrazione
            </Menu.Item>
          )}
          {canSuggest && (
            <Menu.Item leftSection={<IconBulb size={16} />} onClick={() => setSuggesting(true)}>
              Suggerisci un'idea
            </Menu.Item>
          )}
          <Menu.Divider />
          <Menu.Item
            leftSection={<IconLogout size={16} />}
            onClick={() => logout.mutate(undefined, { onSettled: () => navigate('/login') })}
          >
            Esci
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      {suggesting && <FeedbackModal onClose={() => setSuggesting(false)} />}
    </>
  )
}
