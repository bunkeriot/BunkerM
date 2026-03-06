'use client'

import { useCallback, useEffect, useState } from 'react'
import { Tag, Save, Info, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cloudApi, aiApi } from '@/lib/api'
import type { TopicAnnotation, CloudStatus } from '@/types'

type Direction = 'read' | 'write' | 'both'

interface AnnotationRow {
  topic: string
  description: string
  direction: Direction
  example_payloads: string[]
  updated_at: string
}

export default function AnnotationsPage() {
  const [topics, setTopics] = useState<string[]>([])
  const [annotations, setAnnotations] = useState<Record<string, AnnotationRow>>({})
  const [cloudStatus, setCloudStatus] = useState<CloudStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [entitiesRes, annotationsRes, statusRes] = await Promise.all([
        aiApi.getEntities('topic'),
        cloudApi.getAnnotations(),
        cloudApi.getStatus(),
      ])

      const topicList = entitiesRes.entities ?? []
      setTopics(topicList)
      setCloudStatus(statusRes)

      // Index existing annotations by topic
      const annotationMap: Record<string, AnnotationRow> = {}
      for (const a of annotationsRes) {
        annotationMap[a.topic] = a
      }
      // Fill in defaults for new topics
      for (const topic of topicList) {
        if (!annotationMap[topic]) {
          annotationMap[topic] = {
            topic,
            description: '',
            direction: 'both',
            example_payloads: [],
            updated_at: '',
          }
        }
      }
      setAnnotations(annotationMap)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function updateAnnotation(topic: string, field: keyof AnnotationRow, value: string) {
    setAnnotations((prev) => ({
      ...prev,
      [topic]: {
        ...prev[topic],
        [field]: value,
        updated_at: new Date().toISOString(),
      },
    }))
  }

  async function autoGenerate() {
    if (!cloudStatus?.connected) {
      toast.error('BunkerAI Cloud not connected')
      return
    }
    if (topics.length === 0) return
    setIsGenerating(true)
    try {
      const result = await cloudApi.annotateTopics(topics)
      if (result.error) throw new Error(result.error)
      const generated: { topic: string; description: string; direction: string; example_payloads: string[] }[] = result.annotations ?? []
      if (generated.length === 0) { toast.warning('No annotations returned'); return }
      setAnnotations((prev) => {
        const next = { ...prev }
        for (const a of generated) {
          if (next[a.topic]) {
            next[a.topic] = {
              ...next[a.topic],
              description: a.description || next[a.topic].description,
              direction: (a.direction as Direction) || next[a.topic].direction,
              example_payloads: a.example_payloads?.length ? a.example_payloads : next[a.topic].example_payloads,
              updated_at: new Date().toISOString(),
            }
          }
        }
        return next
      })
      toast.success(`Auto-generated ${generated.length} annotation${generated.length !== 1 ? 's' : ''}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Auto-generate failed')
    } finally {
      setIsGenerating(false)
    }
  }

  async function saveAll() {
    setIsSaving(true)
    try {
      const payload: TopicAnnotation[] = Object.values(annotations).map((a) => ({
        ...a,
        updated_at: a.updated_at || new Date().toISOString(),
      }))
      await cloudApi.saveAnnotations(payload)
      toast.success('Annotations saved')
    } catch {
      toast.error('Failed to save annotations')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="h-6 w-6" />
            Topic Annotations
          </h1>
          <p className="text-muted-foreground text-sm">
            Describe your MQTT topics to help BunkerM AI understand your devices.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {cloudStatus && (
            <Badge variant={cloudStatus.connected ? 'default' : 'outline'} className="gap-1">
              <span className={`h-2 w-2 rounded-full ${cloudStatus.connected ? 'bg-green-500' : 'bg-gray-400'}`} />
              {cloudStatus.connected ? `Connected · ${cloudStatus.tier}` : 'Not connected'}
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={autoGenerate}
            disabled={isGenerating || isLoading || !cloudStatus?.connected || topics.length === 0}
          >
            {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Auto-generate
          </Button>
          <Button onClick={saveAll} disabled={isSaving || isLoading}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save All
          </Button>
        </div>
      </div>

      {/* Info callout */}
      <div className="flex gap-3 rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <p>
          Annotations help BunkerM AI understand your devices and provide more accurate answers.
          {!cloudStatus?.connected && ' Connect to BunkerAI Cloud to activate AI features.'}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading topics…
        </div>
      ) : topics.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No topics discovered yet. Topics appear here once your MQTT broker receives messages.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {topics.map((topic) => {
            const ann = annotations[topic]
            return (
              <Card key={topic}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-mono">{topic}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Describe what this topic represents (e.g. 'Temperature sensor in room 3A, °C float')"
                    value={ann?.description ?? ''}
                    onChange={(e) => updateAnnotation(topic, 'description', e.target.value)}
                    rows={2}
                    className="resize-none text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Direction:</span>
                    <Select
                      value={ann?.direction ?? 'both'}
                      onValueChange={(v) => updateAnnotation(topic, 'direction', v)}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="write">Write</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
