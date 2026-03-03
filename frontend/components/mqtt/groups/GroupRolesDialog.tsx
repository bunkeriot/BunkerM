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
import type { Group, Role } from '@/types'

interface GroupRolesDialogProps {
  group: Group | null
  open: boolean
  onOpenChange: (v: boolean) => void
  allRoles: Role[]
  onSuccess: () => void
}

interface BackendGroup {
  name: string
  roles: { name: string; priority: string }[]
  clients: string[]
}

export function GroupRolesDialog({
  group,
  open,
  onOpenChange,
  allRoles,
  onSuccess,
}: GroupRolesDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [loadingRole, setLoadingRole] = useState<string | null>(null)
  const [addingRole, setAddingRole] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentRoleNames, setCurrentRoleNames] = useState<string[]>([])

  const fetchGroupDetail = async (groupname: string) => {
    setLoading(true)
    try {
      const res = await dynsecApi.getGroup(groupname) as { group: BackendGroup }
      setCurrentRoleNames((res.group?.roles ?? []).map((r) => r.name).filter(Boolean))
    } catch {
      setCurrentRoleNames([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && group) {
      setCurrentRoleNames([])
      fetchGroupDetail(group.groupname)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, group?.groupname])

  const assignableRoles = allRoles.filter((r) => !currentRoleNames.includes(r.rolename))

  const handleRemoveRole = async (rolename: string) => {
    if (!group) return
    setLoadingRole(rolename)
    try {
      await dynsecApi.removeGroupRole(group.groupname, rolename)
      toast.success(`Role "${rolename}" removed from group "${group.groupname}"`)
      await fetchGroupDetail(group.groupname)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove role')
    } finally {
      setLoadingRole(null)
    }
  }

  const handleAddRole = async () => {
    if (!group || !selectedRole) return
    setAddingRole(true)
    try {
      await dynsecApi.addGroupRole(group.groupname, selectedRole)
      toast.success(`Role "${selectedRole}" added to group "${group.groupname}"`)
      setSelectedRole('')
      await fetchGroupDetail(group.groupname)
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
            Manage Group Roles
            {group && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                — {group.groupname}
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
              <p className="text-sm text-muted-foreground">No roles assigned to this group.</p>
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

          {/* Add role */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Add Role</Label>
            {assignableRoles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All available roles are already assigned to this group.
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
