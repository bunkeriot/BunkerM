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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { dynsecApi } from '@/lib/api'
import type { MqttClient, Group } from '@/types'

interface ClientGroupsDialogProps {
  client: MqttClient | null
  open: boolean
  onOpenChange: (v: boolean) => void
  availableGroups: Group[]
  onSuccess: () => void
}

interface BackendGroupEntry { name: string; priority: string }
interface BackendClient { username: string; roles: BackendGroupEntry[]; groups: BackendGroupEntry[] }

export function ClientGroupsDialog({
  client,
  open,
  onOpenChange,
  availableGroups,
  onSuccess,
}: ClientGroupsDialogProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [priority, setPriority] = useState<string>('0')
  const [loadingGroup, setLoadingGroup] = useState<string | null>(null)
  const [addingGroup, setAddingGroup] = useState(false)
  const [loading, setLoading] = useState(false)
  // [{groupname, priority}]
  const [currentGroups, setCurrentGroups] = useState<{ groupname: string; priority: number }[]>([])

  const fetchClientDetail = async (username: string) => {
    setLoading(true)
    try {
      const res = await dynsecApi.getClient(username) as { client: BackendClient }
      setCurrentGroups(
        (res.client?.groups ?? [])
          .filter((g) => g.name)
          .map((g) => ({ groupname: g.name, priority: parseInt(g.priority) || 0 }))
      )
    } catch {
      setCurrentGroups([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && client) {
      setCurrentGroups([])
      fetchClientDetail(client.username)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client?.username])

  const currentGroupNames = currentGroups.map((g) => g.groupname)
  const assignableGroups = availableGroups.filter((g) => !currentGroupNames.includes(g.groupname))

  const handleRemoveGroup = async (groupname: string) => {
    if (!client) return
    setLoadingGroup(groupname)
    try {
      await dynsecApi.removeClientFromGroup(groupname, client.username)
      toast.success(`Removed "${client.username}" from group "${groupname}"`)
      await fetchClientDetail(client.username)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove from group')
    } finally {
      setLoadingGroup(null)
    }
  }

  const handleAddGroup = async () => {
    if (!client || !selectedGroup) return
    setAddingGroup(true)
    try {
      const priorityNum = parseInt(priority, 10)
      await dynsecApi.addClientToGroup(
        selectedGroup,
        client.username,
        isNaN(priorityNum) ? 0 : priorityNum
      )
      toast.success(`Added "${client.username}" to group "${selectedGroup}"`)
      setSelectedGroup('')
      setPriority('0')
      await fetchClientDetail(client.username)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add to group')
    } finally {
      setAddingGroup(false)
    }
  }

  const handleClose = () => {
    setSelectedGroup('')
    setPriority('0')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            Manage Groups
            {client && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                — {client.username}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current groups */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Groups</Label>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : currentGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not a member of any groups.</p>
            ) : (
              <div className="space-y-1">
                {currentGroups.map((group) => (
                  <div
                    key={group.groupname}
                    className="flex items-center justify-between rounded-md border px-3 py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{group.groupname}</span>
                      <Badge variant="outline" className="text-xs">
                        priority: {group.priority}
                      </Badge>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveGroup(group.groupname)}
                      disabled={loadingGroup === group.groupname}
                      className="rounded-full p-1 hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                      aria-label={`Remove from group ${group.groupname}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Add to group */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Add to Group</Label>
            {assignableGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Client is already in all available groups.
              </p>
            ) : (
              <div className="flex gap-2">
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a group..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableGroups.map((group) => (
                      <SelectItem key={group.groupname} value={group.groupname}>
                        {group.groupname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  placeholder="Priority"
                  className="w-24"
                  title="Priority (optional)"
                />
                <Button
                  onClick={handleAddGroup}
                  disabled={!selectedGroup || addingGroup}
                  size="sm"
                >
                  {addingGroup ? 'Adding...' : 'Add'}
                </Button>
              </div>
            )}
            {assignableGroups.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Priority is optional and defaults to 0.
              </p>
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
