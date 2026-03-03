'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { GroupsTable } from '@/components/mqtt/groups/GroupsTable'
import { dynsecApi } from '@/lib/api'
import type { Group, MqttClient, Role } from '@/types'

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [clients, setClients] = useState<MqttClient[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true)
    try {
      const [groupsRes, clientsRes, rolesRes] = await Promise.all([
        dynsecApi.getGroups(),
        dynsecApi.getClients(),
        dynsecApi.getRoles(),
      ])
      const groupsList = groupsRes as Group[]

      // Fetch each group's details in parallel to get member and role counts
      const detailResults = await Promise.allSettled(
        groupsList.map((g) => dynsecApi.getGroup(g.groupname))
      )
      const groupsWithCounts = groupsList.map((group, i) => {
        const result = detailResults[i]
        if (result.status === 'fulfilled') {
          const d = result.value as { group?: { roles?: { name: string }[]; clients?: string[] } }
          return {
            ...group,
            roles: (d.group?.roles ?? []).map((r) => ({ rolename: r.name })),
            clients: (d.group?.clients ?? []).map((c) => ({ username: c })),
          }
        }
        return group
      })

      setGroups(groupsWithCounts)
      setClients(clientsRes as MqttClient[])
      setRoles(rolesRes as Role[])
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
          <p className="text-sm">Loading groups...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MQTT Groups</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Organize clients into groups and assign shared roles.
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

      <GroupsTable
        groups={groups}
        allClients={clients}
        allRoles={roles}
        onRefresh={handleRefresh}
      />
    </div>
  )
}
