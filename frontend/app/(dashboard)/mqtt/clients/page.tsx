'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ClientsTable } from '@/components/mqtt/clients/ClientsTable'
import { dynsecApi } from '@/lib/api'
import type { MqttClient, Role, Group } from '@/types'

export default function ClientsPage() {
  const [clients, setClients] = useState<MqttClient[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true)
    try {
      const [clientsRes, rolesRes, groupsRes] = await Promise.all([
        dynsecApi.getClients(),
        dynsecApi.getRoles(),
        dynsecApi.getGroups(),
      ])
      const clientsList = clientsRes as MqttClient[]

      // Fetch each client's details in parallel to get role/group counts and disabled state
      const detailResults = await Promise.allSettled(
        clientsList.map((c) => dynsecApi.getClient(c.username))
      )
      const clientsWithCounts = clientsList.map((client, i) => {
        const result = detailResults[i]
        if (result.status === 'fulfilled') {
          const d = result.value as { client?: { roles?: { name: string }[]; groups?: { name: string }[]; disabled?: boolean } }
          return {
            ...client,
            roles: (d.client?.roles ?? []).map((r) => ({ rolename: r.name })),
            groups: (d.client?.groups ?? []).map((g) => ({ groupname: g.name })),
            disabled: d.client?.disabled ?? false,
          }
        }
        return client
      })

      setClients(clientsWithCounts)
      setRoles(rolesRes as Role[])
      setGroups(groupsRes as Group[])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = () => fetchData(true)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading clients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MQTT Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage MQTT client accounts, their roles and group memberships.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <ClientsTable
        clients={clients}
        availableRoles={roles}
        availableGroups={groups}
        onRefresh={handleRefresh}
      />
    </div>
  )
}
