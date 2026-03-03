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
import type { Group, MqttClient } from '@/types'

interface GroupMembersDialogProps {
  group: Group | null
  open: boolean
  onOpenChange: (v: boolean) => void
  allClients: MqttClient[]
  onSuccess: () => void
}

// Backend getGroup returns clients as plain string array
interface BackendGroup {
  name: string
  roles: { name: string; priority: string }[]
  clients: string[]
}

export function GroupMembersDialog({
  group,
  open,
  onOpenChange,
  allClients,
  onSuccess,
}: GroupMembersDialogProps) {
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [priority, setPriority] = useState<string>('0')
  const [loadingMember, setLoadingMember] = useState<string | null>(null)
  const [addingMember, setAddingMember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentMembers, setCurrentMembers] = useState<string[]>([])

  const fetchGroupDetail = async (groupname: string) => {
    setLoading(true)
    try {
      const res = await dynsecApi.getGroup(groupname) as { group: BackendGroup }
      setCurrentMembers((res.group?.clients ?? []).filter(Boolean))
    } catch {
      setCurrentMembers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && group) {
      setCurrentMembers([])
      fetchGroupDetail(group.groupname)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, group?.groupname])

  const assignableClients = allClients.filter((c) => !currentMembers.includes(c.username))

  const handleRemoveMember = async (username: string) => {
    if (!group) return
    setLoadingMember(username)
    try {
      await dynsecApi.removeClientFromGroup(group.groupname, username)
      toast.success(`Removed "${username}" from group "${group.groupname}"`)
      await fetchGroupDetail(group.groupname)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setLoadingMember(null)
    }
  }

  const handleAddMember = async () => {
    if (!group || !selectedClient) return
    setAddingMember(true)
    try {
      const priorityNum = parseInt(priority, 10)
      await dynsecApi.addClientToGroup(
        group.groupname,
        selectedClient,
        isNaN(priorityNum) ? 0 : priorityNum
      )
      toast.success(`Added "${selectedClient}" to group "${group.groupname}"`)
      setSelectedClient('')
      setPriority('0')
      await fetchGroupDetail(group.groupname)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  const handleClose = () => {
    setSelectedClient('')
    setPriority('0')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            Manage Members
            {group && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                — {group.groupname}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current members */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Members</Label>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : currentMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members in this group.</p>
            ) : (
              <div className="space-y-1">
                {currentMembers.map((username) => (
                  <div
                    key={username}
                    className="flex items-center justify-between rounded-md border px-3 py-1.5"
                  >
                    <span className="text-sm font-medium">{username}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(username)}
                      disabled={loadingMember === username}
                      className="rounded-full p-1 hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                      aria-label={`Remove ${username} from group`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Add member */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Add Member</Label>
            {assignableClients.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All clients are already members of this group.
              </p>
            ) : (
              <div className="flex gap-2">
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableClients.map((client) => (
                      <SelectItem key={client.username} value={client.username}>
                        {client.username}
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
                  onClick={handleAddMember}
                  disabled={!selectedClient || addingMember}
                  size="sm"
                >
                  {addingMember ? 'Adding...' : 'Add'}
                </Button>
              </div>
            )}
            {assignableClients.length > 0 && (
              <p className="text-xs text-muted-foreground">Priority is optional and defaults to 0.</p>
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
