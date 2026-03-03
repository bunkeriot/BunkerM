'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, Upload, RefreshCw, RotateCcw, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { configApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

export default function DynSecJsonPage() {
  const [json, setJson] = useState('')
  const [original, setOriginal] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isValid, setIsValid] = useState(true)

  const fetchConfig = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await configApi.getDynSecJson()
      const formatted = JSON.stringify(data, null, 2)
      setJson(formatted)
      setOriginal(formatted)
      setIsValid(true)
    } catch {
      toast.error('Failed to load DynSec configuration')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleChange = (value: string) => {
    setJson(value)
    try {
      JSON.parse(value)
      setIsValid(true)
    } catch {
      setIsValid(false)
    }
  }

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(json)
      setJson(JSON.stringify(parsed, null, 2))
      setIsValid(true)
    } catch {
      toast.error('Invalid JSON - cannot format')
    }
  }

  const handleImport = async () => {
    if (!isValid) {
      toast.error('JSON is invalid')
      return
    }
    setIsSaving(true)
    try {
      const parsed = JSON.parse(json)
      const formData = new FormData()
      const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' })
      formData.append('file', blob, 'dynsec.json')
      await configApi.importDynSecJson(formData)
      setOriginal(json)
      toast.success('DynSec configuration imported successfully')
    } catch {
      toast.error('Failed to import configuration')
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = () => {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dynsec-config-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const isDirty = json !== original

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">DynSec JSON Configuration</h1>
          <p className="text-muted-foreground text-sm">View and import dynamic security configuration</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchConfig} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Reload
          </Button>
          {isDirty && (
            <Button variant="outline" size="sm" onClick={() => { setJson(original); setIsValid(true) }}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleFormat} disabled={!isValid}>
            Format JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!json}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={handleImport} disabled={isSaving || !isValid || !isDirty}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dynamic Security Config</CardTitle>
          <CardDescription>
            Raw JSON configuration for Mosquitto dynamic security plugin.
            Edit and click Import to apply changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Textarea
              value={json}
              onChange={(e) => handleChange(e.target.value)}
              className={`font-mono text-xs min-h-[calc(100vh-380px)] resize-none ${
                !isValid ? 'border-destructive focus-visible:ring-destructive' : ''
              }`}
              placeholder="{}"
              spellCheck={false}
            />
          )}
        </CardContent>
      </Card>

      {!isValid && (
        <p className="text-xs text-destructive">Invalid JSON syntax</p>
      )}
      {isDirty && isValid && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          You have unsaved changes. Click Import to apply.
        </p>
      )}
    </div>
  )
}
