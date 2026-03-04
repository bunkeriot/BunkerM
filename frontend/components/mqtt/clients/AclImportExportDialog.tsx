'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Download, Upload, FileJson, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { configApi } from '@/lib/api'

interface AclImportExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportSuccess: () => void
}

export function AclImportExportDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: AclImportExportDialogProps) {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await configApi.exportDynSecJson()
      if (!response.ok) {
        const err = await response.text()
        throw new Error(err || `HTTP ${response.status}`)
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bunkerm-acl-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('ACL configuration exported successfully')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] ?? null)
  }

  const handleImport = async () => {
    if (!selectedFile) return
    setImporting(true)
    try {
      // Read and parse JSON client-side first for quick validation
      const text = await selectedFile.text()
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        throw new Error('The selected file is not valid JSON')
      }

      // POST JSON body — avoids multipart proxy issues
      const data = await configApi.importAcl(parsed)
      if (!data.success) {
        throw new Error(data.message || 'Import failed')
      }

      toast.success(`ACL imported — broker is reloading (${data.stats?.clients ?? 0} clients, ${data.stats?.roles ?? 0} roles, ${data.stats?.groups ?? 0} groups)`)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      onOpenChange(false)
      // Delay refresh slightly to let Mosquitto restart
      setTimeout(onImportSuccess, 3000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Import / Export ACL
          </DialogTitle>
          <DialogDescription>
            Back up or restore the complete ACL configuration — clients, roles, and groups.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="export" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import" className="flex-1">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </TabsTrigger>
          </TabsList>

          {/* Export tab */}
          <TabsContent value="export" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Download a complete snapshot of all clients (with password hashes), roles with ACL
              rules, and groups. The file can be used to restore or migrate your configuration.
            </p>
            <Button onClick={handleExport} disabled={exporting} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting…' : 'Download ACL JSON'}
            </Button>
          </TabsContent>

          {/* Import tab */}
          <TabsContent value="import" className="space-y-4 pt-4">
            <div className="rounded-md border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 p-3 flex gap-2 text-sm text-yellow-800 dark:text-yellow-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Importing will <strong>overwrite</strong> the current ACL configuration. This
                cannot be undone. Export a backup first if needed.
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select JSON file</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="block w-full text-sm text-muted-foreground
                  file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border
                  file:border-input file:bg-background file:text-sm file:font-medium
                  file:text-foreground hover:file:bg-accent cursor-pointer"
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  Selected: <span className="font-medium">{selectedFile.name}</span>{' '}
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <Button
              onClick={handleImport}
              disabled={!selectedFile || importing}
              variant="destructive"
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'Importing…' : 'Import & Overwrite ACL'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
