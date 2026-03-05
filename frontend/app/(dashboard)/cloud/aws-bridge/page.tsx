'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Save, Loader2, RefreshCw, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { awsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FileUploadField {
  label: string
  name: string
  description: string
}

const fileFields: FileUploadField[] = [
  { label: 'CA Certificate', name: 'ca_file', description: 'Root CA certificate (.pem)' },
  { label: 'Client Certificate', name: 'cert_file', description: 'Client certificate (.pem)' },
  { label: 'Private Key', name: 'key_file', description: 'Private key file (.pem)' },
]

export default function AwsBridgePage() {
  const [host, setHost] = useState('')
  const [port, setPort] = useState('8883')
  const [clientId, setClientId] = useState('')
  const [topic, setTopic] = useState('#')
  const [files, setFiles] = useState<Record<string, File>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const fetchConfig = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await awsApi.getConfig() as Record<string, string>
      setHost(data.host || '')
      setPort(String(data.port || '8883'))
      setClientId(data.clientId || '')
      setTopic(data.topic || '#')
    } catch {
      // Config may not exist yet
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleFileChange = (name: string, file: File | null) => {
    if (file) {
      setFiles((prev) => ({ ...prev, [name]: file }))
    } else {
      setFiles((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleSave = async () => {
    if (!host) {
      toast.error('AWS endpoint host is required')
      return
    }
    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('host', host)
      formData.append('port', port)
      formData.append('clientId', clientId)
      formData.append('topic', topic)
      Object.entries(files).forEach(([name, file]) => {
        formData.append(name, file)
      })
      const res = await awsApi.saveConfig(formData)
      if (res.ok) {
        toast.success('AWS Bridge configuration saved')
      } else {
        toast.error('Failed to save configuration')
      }
    } catch {
      toast.error('Failed to connect to AWS Bridge API')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AWS IoT Bridge</h1>
          <p className="text-muted-foreground text-sm">Connect your MQTT broker to AWS IoT Core</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchConfig} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Reload
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connection Settings</CardTitle>
          <CardDescription>Configure the AWS IoT Core endpoint</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="host">AWS IoT Endpoint</Label>
            <Input
              id="host"
              placeholder="xxxxxx-ats.iot.us-east-1.amazonaws.com"
              value={host}
              onChange={(e) => setHost(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                placeholder="bunkerm-bridge"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic">Topic Filter</Label>
            <Input
              id="topic"
              placeholder="#"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>TLS Certificates</CardTitle>
          <CardDescription>Upload the certificates for mutual TLS authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fileFields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label>{field.label}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".pem,.crt,.key,.cert"
                  className="hidden"
                  ref={(el) => { fileRefs.current[field.name] = el }}
                  onChange={(e) => handleFileChange(field.name, e.target.files?.[0] || null)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileRefs.current[field.name]?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Choose file
                </Button>
                {files[field.name] ? (
                  <span className="text-sm text-primary">{files[field.name].name}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">{field.description}</span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Configuration
      </Button>
    </div>
  )
}
