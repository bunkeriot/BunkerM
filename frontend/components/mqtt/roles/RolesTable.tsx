'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, ListChecks, RefreshCw } from 'lucide-react'
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
import { CreateRoleDialog } from './CreateRoleDialog'
import { ACLDialog } from './ACLDialog'
import { dynsecApi } from '@/lib/api'
import type { Role, ACL } from '@/types'

interface RolesTableProps {
  roles: Role[]
  onRefresh: () => void
}

export function RolesTable({ roles, onRefresh }: RolesTableProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [aclRole, setAclRole] = useState<Role | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null)
  const [deletingRolename, setDeletingRolename] = useState<string | null>(null)
  // Track ACL counts locally since the list endpoint returns no ACL data
  const [aclCounts, setAclCounts] = useState<Record<string, number>>({})

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeletingRolename(deleteTarget.rolename)
    try {
      await dynsecApi.deleteRole(deleteTarget.rolename)
      toast.success(`Role "${deleteTarget.rolename}" deleted`)
      setDeleteTarget(null)
      onRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete role')
    } finally {
      setDeletingRolename(null)
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
              Create Role
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>ACL Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No roles found.
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.rolename}>
                    <TableCell className="font-medium">{role.rolename}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {aclCounts[role.rolename] ?? (role.acls ?? []).length} ACL
                        {(aclCounts[role.rolename] ?? (role.acls ?? []).length) !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setAclRole(role)}
                              aria-label={`Manage ACLs for ${role.rolename}`}
                            >
                              <ListChecks className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Manage ACLs</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(role)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              aria-label={`Delete ${role.rolename}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete role</TooltipContent>
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
          {roles.length} role{roles.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Create role dialog */}
      <CreateRoleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={onRefresh}
      />

      {/* ACL management dialog */}
      <ACLDialog
        role={aclRole}
        open={aclRole !== null}
        onOpenChange={(v) => { if (!v) setAclRole(null) }}
        onSuccess={(acls: ACL[]) => {
          if (aclRole) setAclCounts((prev) => ({ ...prev, [aclRole.rolename]: acls.length }))
          onRefresh()
        }}
      />

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete role{' '}
              <span className="font-semibold text-foreground">{deleteTarget?.rolename}</span>?
              This will remove the role from all clients and groups that use it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletingRolename !== null}
            >
              {deletingRolename ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
