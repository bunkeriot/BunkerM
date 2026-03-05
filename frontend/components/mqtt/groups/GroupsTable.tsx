'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Users, Shield, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CreateGroupDialog } from './CreateGroupDialog'
import { GroupMembersDialog } from './GroupMembersDialog'
import { GroupRolesDialog } from './GroupRolesDialog'
import { dynsecApi } from '@/lib/api'
import type { Group, MqttClient, Role } from '@/types'

interface GroupsTableProps {
  groups: Group[]
  allClients: MqttClient[]
  allRoles: Role[]
  onRefresh: () => void
}

export function GroupsTable({ groups, allClients, allRoles, onRefresh }: GroupsTableProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [membersGroup, setMembersGroup] = useState<Group | null>(null)
  const [rolesGroup, setRolesGroup] = useState<Group | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null)
  const [deletingGroupname, setDeletingGroupname] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeletingGroupname(deleteTarget.groupname)
    try {
      await dynsecApi.deleteGroup(deleteTarget.groupname)
      toast.success(`Group "${deleteTarget.groupname}" deleted`)
      setDeleteTarget(null)
      onRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete group')
    } finally {
      setDeletingGroupname(null)
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div />
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={onRefresh} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No groups found.
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((group) => (
                  <TableRow key={group.groupname}>
                    <TableCell className="font-medium">{group.groupname}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {(group.clients ?? []).length} member
                        {(group.clients ?? []).length !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {(group.roles ?? []).length} role
                        {(group.roles ?? []).length !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setMembersGroup(group)}
                              aria-label={`Manage members of ${group.groupname}`}
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Manage members</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setRolesGroup(group)}
                              aria-label={`Manage roles of ${group.groupname}`}
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Manage roles</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(group)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              aria-label={`Delete ${group.groupname}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete group</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground">
          {groups.length} group{groups.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Create group dialog */}
      <CreateGroupDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={onRefresh}
      />

      {/* Members dialog */}
      <GroupMembersDialog
        group={membersGroup}
        open={membersGroup !== null}
        onOpenChange={(v) => { if (!v) setMembersGroup(null) }}
        allClients={allClients}
        onSuccess={onRefresh}
      />

      {/* Roles dialog */}
      <GroupRolesDialog
        group={rolesGroup}
        open={rolesGroup !== null}
        onOpenChange={(v) => { if (!v) setRolesGroup(null) }}
        allRoles={allRoles}
        onSuccess={onRefresh}
      />

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete group{' '}
              <span className="font-semibold text-foreground">{deleteTarget?.groupname}</span>?
              All members will be removed from this group.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletingGroupname !== null}
            >
              {deletingGroupname ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
