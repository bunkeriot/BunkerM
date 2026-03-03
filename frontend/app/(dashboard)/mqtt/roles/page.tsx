'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { RolesTable } from '@/components/mqtt/roles/RolesTable'
import { dynsecApi } from '@/lib/api'
import type { Role, ACL } from '@/types'

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true)
    try {
      const res = await dynsecApi.getRoles()
      const rolesList = res as Role[]

      // Fetch each role's details in parallel to get ACL counts
      const detailResults = await Promise.allSettled(
        rolesList.map((r) => dynsecApi.getRole(r.rolename))
      )
      const rolesWithAcls = rolesList.map((role, i) => {
        const result = detailResults[i]
        if (result.status === 'fulfilled') {
          const d = result.value as { role?: string; acls?: ACL[] }
          return { ...role, acls: d.acls ?? [] }
        }
        return role
      })

      setRoles(rolesWithAcls)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load roles')
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
          <p className="text-sm">Loading roles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MQTT Roles</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Define roles with ACL rules to control MQTT topic access.
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

      <RolesTable roles={roles} onRefresh={handleRefresh} />
    </div>
  )
}
