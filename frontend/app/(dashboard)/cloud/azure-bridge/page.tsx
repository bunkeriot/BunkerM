'use client'

import { useCallback, useEffect, useState } from 'react'
import { Save, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { azureApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AzureBridgePage() {
  const [connectionString, setConnectionString] = useState('')
  const [hubName, setHubName] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [sasToken, setSasToken] = useState('')
  const [topic, setTopic] = useState('#')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const fetchConfig = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await azureApi.getConfig() as Record<string, string>
      setConnectionString(data.connectionString || '')
      setHubName(data.hubName || '')
      setDeviceId(data.deviceId || '')
      setSasToken(data.sasToken || '')
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

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await azureApi.saveConfig({
        connectionString,
        hubName,
        deviceId,
        sasToken,
        topic,
      })
      toast.success('Azure Bridge configuration saved')
    } catch {
      toast.error('Failed to connect to Azure Bridge API')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Azure IoT Bridge</h1>
          <p className="text-muted-foreground text-sm">Connect your MQTT broker to Azure IoT Hub</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchConfig} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Reload
        </Button>
      </div>

      <Tabs defaultValue="connection-string">
        <TabsList>
          <TabsTrigger value="connection-string">Connection String</TabsTrigger>
          <TabsTrigger value="sas-token">SAS Token</TabsTrigger>
        </TabsList>

        <TabsContent value="connection-string" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>IoT Hub Connection String</CardTitle>
              <CardDescription>Use a device connection string from Azure IoT Hub</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="connectionString">Connection String</Label>
                <Textarea
                  id="connectionString"
                  placeholder="HostName=xxx.azure-devices.net;DeviceId=xxx;SharedAccessKey=xxx"
                  value={connectionString}
                  onChange={(e) => setConnectionString(e.target.value)}
                  className="font-mono text-xs"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sas-token" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>SAS Token Authentication</CardTitle>
              <CardDescription>Manually configure IoT Hub and SAS token</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hubName">IoT Hub Name</Label>
                  <Input
                    id="hubName"
                    placeholder="my-iot-hub"
                    value={hubName}
                    onChange={(e) => setHubName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deviceId">Device ID</Label>
                  <Input
                    id="deviceId"
                    placeholder="my-device"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sasToken">SAS Token</Label>
                <Textarea
                  id="sasToken"
                  placeholder="SharedAccessSignature sr=..."
                  value={sasToken}
                  onChange={(e) => setSasToken(e.target.value)}
                  className="font-mono text-xs"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Bridge Settings</CardTitle>
        </CardHeader>
        <CardContent>
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

      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Configuration
      </Button>
    </div>
  )
}
