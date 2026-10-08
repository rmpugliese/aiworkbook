import { Button, Menu, Text } from '@mantine/core'
import { Link, useNavigate } from 'react-router'

import { useLogout, useMe } from '../api/auth'

export function UserMenu() {
  const me = useMe()
  const logout = useLogout()
  const navigate = useNavigate()

  if (!me.data) return null
  const label = me.data.display_name ?? me.data.email

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <Button variant="subtle" size="compact-sm">
          {label}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>
          <Text size="xs">{me.data.email}</Text>
        </Menu.Label>
        {me.data.is_admin && (
          <Menu.Item component={Link} to="/admin">
            Amministrazione
          </Menu.Item>
        )}
        <Menu.Item
          onClick={() => logout.mutate(undefined, { onSettled: () => navigate('/login') })}
        >
          Esci
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
