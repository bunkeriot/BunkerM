'use client'

import { useCallback, useEffect, useState } from 'react'
import { Save, RefreshCw, RotateCcw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { configApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

export default function MosquittoConfigPage() {
  const [config, setConfig] = useState('')
  const [original, setOriginal] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const fetchConfig = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await configApi.getMosquittoConfig()
      const content = data.config || data.content || ''
      setConfig(content)
      setOriginal(content)
    } catch {
      toast.error('Failed to load Mosquitto configuration')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await configApi.saveMosquittoConfig({ config })
      setOriginal(config)
      toast.success('Configuration saved successfully')
    } catch {
      toast.error('Failed to save configuration')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setConfig(original)
    toast.info('Configuration reset to last saved state')
  }

  const isDirty = config !== original

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Broker Configuration</h1>
          <p className="text-muted-foreground text-sm">Edit Mosquitto broker configuration file</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchConfig} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Reload
          </Button>
          {isDirty && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={isSaving || !isDirty}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>mosquitto.conf</CardTitle>
          <CardDescription>
            Edit the Mosquitto broker configuration. Changes require a broker restart to take effect.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Textarea
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              className="font-mono text-sm min-h-[calc(100vh-380px)] resize-none"
              placeholder="# Mosquitto configuration"
              spellCheck={false}
            />
          )}
        </CardContent>
      </Card>

      {isDirty && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          You have unsaved changes. Click Save to apply.
        </p>
      )}
    </div>
  )
}
