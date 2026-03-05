'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { dynsecApi } from '@/lib/api'
import type { Role, ACL } from '@/types'

// Backend only accepts these two types
const ACL_TYPES = [
  { value: 'publishClientSend', label: 'Publish (Client Send)' },
  { value: 'subscribeLiteral', label: 'Subscribe (Literal)' },
]

interface ACLDialogProps {
  role: Role | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: (acls: ACL[]) => void
}

export function ACLDialog({ role, open, onOpenChange, onSuccess }: ACLDialogProps) {
  const [currentRole, setCurrentRole] = useState<Role | null>(role)
  const [acltype, setAcltype] = useState<string>('')
  const [topic, setTopic] = useState<string>('')
  const [allow, setAllow] = useState<string>('allow')
  const [addingACL, setAddingACL] = useState(false)
  const [removingACL, setRemovingACL] = useState<string | null>(null)
  const [loadingRole, setLoadingRole] = useState(false)

  useEffect(() => {
    if (open && role) {
      setCurrentRole(role)
      refreshRole(role.rolename)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, role?.rolename])

  const refreshRole = async (rolename: string) => {
    setLoadingRole(true)
    try {
      // Backend returns { role: "string_name", acls: [{aclType, topic, permission, priority}] }
      const res = await dynsecApi.getRole(rolename) as { role: string; acls?: ACL[] }
      setCurrentRole({ rolename: res.role ?? rolename, acls: res.acls ?? [] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load role details')
    } finally {
      setLoadingRole(false)
    }
  }

  const handleAddACL = async () => {
    if (!currentRole || !acltype || !topic) return
    setAddingACL(true)
    try {
      await dynsecApi.addRoleACL(currentRole.rolename, {
        aclType: acltype,
        topic,
        permission: allow,
      })
      toast.success('ACL added successfully')
      setAcltype('')
      setTopic('')
      setAllow('allow')
      await refreshRole(currentRole.rolename)
      // notify parent with updated acls so count can update
      const updated = { rolename: currentRole.rolename, acls: currentRole.acls ?? [] }
      onSuccess(updated.acls)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add ACL')
    } finally {
      setAddingACL(false)
    }
  }

  const handleRemoveACL = async (acl: ACL) => {
    if (!currentRole) return
    const key = `${acl.aclType}:${acl.topic}`
    setRemovingACL(key)
    try {
      await dynsecApi.removeRoleACL(currentRole.rolename, acl.aclType, acl.topic)
      toast.success('ACL removed successfully')
      await refreshRole(currentRole.rolename)
      onSuccess(currentRole.acls ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove ACL')
    } finally {
      setRemovingACL(null)
    }
  }

  const handleClose = () => {
    setAcltype('')
    setTopic('')
    setAllow('allow')
    onOpenChange(false)
  }

  const acls = currentRole?.acls ?? []

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Manage ACLs
            {currentRole && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                — {currentRole.rolename}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Existing ACLs */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current ACLs</Label>
            {loadingRole ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : acls.length === 0 ? (
              <p className="text-sm text-muted-foreground">No ACLs defined for this role.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Permission</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {acls.map((acl) => {
                      const key = `${acl.aclType}:${acl.topic}`
                      const typeLabel =
                        ACL_TYPES.find((t) => t.value === acl.aclType)?.label ?? acl.aclType
                      return (
                        <TableRow key={key}>
                          <TableCell className="text-xs font-mono">{typeLabel}</TableCell>
                          <TableCell className="font-mono text-xs max-w-[180px] truncate">
                            {acl.topic}
                          </TableCell>
                          <TableCell>
                            <Badge variant={acl.permission === 'allow' ? 'success' : 'destructive'}>
                              {acl.permission === 'allow' ? 'Allow' : 'Deny'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveACL(acl)}
                              disabled={removingACL === key}
                              aria-label="Remove ACL"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <Separator />

          {/* Add new ACL */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Add ACL</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">ACL Type</Label>
                <Select value={acltype} onValueChange={setAcltype}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ACL_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Topic</Label>
                <Input
                  placeholder="e.g. sensors/#"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Permission</Label>
                <Select value={allow} onValueChange={setAllow}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allow">Allow</SelectItem>
                    <SelectItem value="deny">Deny</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleAddACL}
              disabled={!acltype || !topic || addingACL}
              size="sm"
            >
              {addingACL ? 'Adding...' : 'Add ACL'}
            </Button>
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
