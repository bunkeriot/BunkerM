'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { dynsecApi } from '@/lib/api'
import type { MqttClient, Role } from '@/types'

interface ClientRolesDialogProps {
  client: MqttClient | null
  open: boolean
  onOpenChange: (v: boolean) => void
  availableRoles: Role[]
  onSuccess: () => void
}

// Backend getClient returns roles as [{name, priority}]
interface BackendRole { name: string; priority: string }
interface BackendClient { username: string; roles: BackendRole[]; groups: BackendRole[] }

export function ClientRolesDialog({
  client,
  open,
  onOpenChange,
  availableRoles,
  onSuccess,
}: ClientRolesDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [loadingRole, setLoadingRole] = useState<string | null>(null)
  const [addingRole, setAddingRole] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentRoleNames, setCurrentRoleNames] = useState<string[]>([])

  const fetchClientDetail = async (username: string) => {
    setLoading(true)
    try {
      const res = await dynsecApi.getClient(username) as { client: BackendClient }
      setCurrentRoleNames((res.client?.roles ?? []).map((r) => r.name).filter(Boolean))
    } catch {
      setCurrentRoleNames([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && client) {
      setCurrentRoleNames([])
      fetchClientDetail(client.username)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client?.username])

  const assignableRoles = availableRoles.filter((r) => !currentRoleNames.includes(r.rolename))

  const handleRemoveRole = async (rolename: string) => {
    if (!client) return
    setLoadingRole(rolename)
    try {
      await dynsecApi.removeClientRole(client.username, rolename)
      toast.success(`Role "${rolename}" removed from "${client.username}"`)
      await fetchClientDetail(client.username)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove role')
    } finally {
      setLoadingRole(null)
    }
  }

  const handleAddRole = async () => {
    if (!client || !selectedRole) return
    setAddingRole(true)
    try {
      await dynsecApi.addClientRole(client.username, selectedRole)
      toast.success(`Role "${selectedRole}" added to "${client.username}"`)
      setSelectedRole('')
      await fetchClientDetail(client.username)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add role')
    } finally {
      setAddingRole(false)
    }
  }

  const handleClose = () => {
    setSelectedRole('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            Manage Roles
            {client && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                — {client.username}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current roles */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Roles</Label>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : currentRoleNames.length === 0 ? (
              <p className="text-sm text-muted-foreground">No roles assigned.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {currentRoleNames.map((rolename) => (
                  <Badge
                    key={rolename}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    {rolename}
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(rolename)}
                      disabled={loadingRole === rolename}
                      className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 transition-colors disabled:opacity-50"
                      aria-label={`Remove role ${rolename}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Add new role */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Add Role</Label>
            {assignableRoles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All available roles are already assigned.
              </p>
            ) : (
              <div className="flex gap-2">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((role) => (
                      <SelectItem key={role.rolename} value={role.rolename}>
                        {role.rolename}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddRole}
                  disabled={!selectedRole || addingRole}
                  size="sm"
                >
                  {addingRole ? 'Adding...' : 'Add'}
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
