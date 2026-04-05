'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageSquare, Send, Loader2, Info, Check, X, Cpu, Cloud, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { chatApi, localLlmApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import type { ChatMessage, PendingAction } from '@/types'

// ─── Local storage helpers ───────────────────────────────────────────────────
const MAX_LOCAL = 50
const CHAT_MODE_KEY = 'bunkerm_chat_mode'

function storageKey(userId: string) {
  return `bunkerm_chat_${userId}`
}

function localLlmStorageKey(userId: string) {
  return `bunkerm_local_llm_chat_${userId}`
}

function readChatMode(): ChatMode {
  try {
    const v = localStorage.getItem(CHAT_MODE_KEY)
    if (v === 'local' || v === 'cloud') return v
  } catch {}
  return 'cloud'
}

function writeChatMode(mode: ChatMode) {
  try { localStorage.setItem(CHAT_MODE_KEY, mode) } catch {}
}

function readLocal(userId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    return raw ? (JSON.parse(raw) as ChatMessage[]) : []
  } catch {
    return []
  }
}

function readLocalLlm(userId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(localLlmStorageKey(userId))
    return raw ? (JSON.parse(raw) as ChatMessage[]) : []
  } catch {
    return []
  }
}

function writeLocal(userId: string, msgs: ChatMessage[]) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(msgs.slice(-MAX_LOCAL)))
  } catch {}
}

function writeLocalLlm(userId: string, msgs: ChatMessage[]) {
  try {
    localStorage.setItem(localLlmStorageKey(userId), JSON.stringify(msgs.slice(-MAX_LOCAL)))
  } catch {}
}

// ─── Pending action confirm/cancel (cloud mode only) ─────────────────────────

function PendingButtons({
  pending,
  userId,
  onConfirm,
  onCancel,
}: {
  pending: PendingAction
  userId: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')

  async function handleConfirm() {
    setState('loading')
    try {
      await chatApi.confirm(pending.id, userId)
    } catch {}
    setState('done')
    onConfirm()
  }

  async function handleCancel() {
    setState('loading')
    try {
      await chatApi.cancel(pending.id, userId)
    } catch {}
    setState('done')
    onCancel()
  }

  if (state === 'done') return null

  return (
    <div className="mt-2 flex gap-2">
      <Button
        size="sm"
        variant="default"
        disabled={state === 'loading'}
        onClick={handleConfirm}
        className="gap-1.5 h-7 text-xs"
      >
        {state === 'loading' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
        Confirm
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={state === 'loading'}
        onClick={handleCancel}
        className="gap-1.5 h-7 text-xs"
      >
        <X className="h-3 w-3" />
        Cancel
      </Button>
    </div>
  )
}

// ─── Message bubble ──────────────────────────────────────────────────────────

const CONNECTOR_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  slack: 'Slack',
  webchat: 'Web',
}

function MessageBubble({
  msg,
  userId,
  onResolvePending,
}: {
  msg: ChatMessage
  userId: string
  onResolvePending: (msgId: string, confirmed: boolean) => void
}) {
  const isUser = msg.role === 'user'
  const showConnectorBadge = msg.connector && msg.connector !== 'webchat'
  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      {showConnectorBadge && (
        <span className="text-[10px] text-muted-foreground mb-0.5 px-1">
          via {CONNECTOR_LABELS[msg.connector!] ?? msg.connector}
        </span>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        }`}
      >
        {msg.content}
        {msg.pending && (
          <PendingButtons
            pending={msg.pending}
            userId={userId}
            onConfirm={() => onResolvePending(msg.id, true)}
            onCancel={() => onResolvePending(msg.id, false)}
          />
        )}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

type ChatMode = 'cloud' | 'local'

export default function ChatPage() {
  const { user, isLoading: authLoading } = useAuth()
  const userId = user?.id ?? 'web'

  const [mode, setMode] = useState<ChatMode>(() => {
    if (typeof window !== 'undefined') return readChatMode()
    return 'cloud'
  })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null)

  // Local LLM state
  const [llmEnabled, setLlmEnabled] = useState(false)
  const [llmModel, setLlmModel] = useState('')
  const [llmReady, setLlmReady] = useState<boolean | null>(null)

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const didInitialScroll = useRef(false)
  const initialisedFor = useRef<string | null>(null)

  // ── Initialise once auth has settled ──────────────────────────────────────
  useEffect(() => {
    if (authLoading) return
    if (initialisedFor.current === userId) return
    initialisedFor.current = userId

    // Check cloud config
    chatApi.isConfigured().then(setIsConfigured).catch(() => setIsConfigured(false))

    // Check local LLM config
    localLlmApi.getConfig().then(cfg => {
      setLlmEnabled(cfg.enabled ?? false)
      setLlmModel(cfg.model ?? '')
      if (cfg.enabled && cfg.model) setLlmReady(true)
      else setLlmReady(false)
    }).catch(() => setLlmReady(false))
  }, [authLoading, userId])

  // ── Load messages when mode or userId changes ──────────────────────────────
  useEffect(() => {
    if (authLoading) return
    didInitialScroll.current = false

    if (mode === 'local') {
      const cached = readLocalLlm(userId)
      setMessages(cached)
      return
    }

    // Cloud mode
    const cached = readLocal(userId)
    if (cached.length) setMessages(cached)

    chatApi.getHistory()
      .then(({ messages: serverMsgs }) => {
        if (!serverMsgs?.length) return
        const normalised: ChatMessage[] = serverMsgs.map((m) => ({
          id: crypto.randomUUID(),
          role: m.role as 'user' | 'assistant',
          content: m.content,
          ts: m.ts,
          connector: m.connector,
        }))
        setMessages(normalised)
        writeLocal(userId, normalised)
      })
      .catch(() => {})
  }, [authLoading, userId, mode])

  // Reset on user change
  useEffect(() => {
    didInitialScroll.current = false
    initialisedFor.current = null
  }, [userId])

  // ── Scroll ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = scrollAreaRef.current
    if (!el) return
    if (!didInitialScroll.current) {
      el.scrollTop = el.scrollHeight
      didInitialScroll.current = true
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, isSending])

  // ── Persist on change ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!messages.length || userId === 'web') return
    if (mode === 'local') writeLocalLlm(userId, messages)
    else writeLocal(userId, messages)
  }, [messages, userId, mode])

  // ── Clear history ─────────────────────────────────────────────────────────
  function clearHistory() {
    setMessages([])
    if (mode === 'local') {
      try { localStorage.removeItem(localLlmStorageKey(userId)) } catch {}
    } else {
      try { localStorage.removeItem(storageKey(userId)) } catch {}
    }
    setInput('')
  }

  // ── Send ──────────────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = input.trim()
    if (!text || isSending) return

    // Handle /reset command
    if (text === '/reset') {
      clearHistory()
      return
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      ts: new Date().toISOString(),
      connector: 'webchat',
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsSending(true)

    if (mode === 'local') {
      // Build messages array for local LLM
      const history = [...messages, userMsg]
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }))

      try {
        const result = await localLlmApi.chat(history, llmModel)
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: result.reply ?? result.error ?? 'No response received.',
            ts: new Date().toISOString(),
          },
        ])
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Failed to reach LM Studio. Make sure it is running and the model is loaded.',
            ts: new Date().toISOString(),
          },
        ])
      } finally {
        setIsSending(false)
      }
      return
    }

    // Cloud mode
    try {
      const result = await chatApi.send(text, userId)
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.reply ?? result.error ?? 'No response received.',
          ts: new Date().toISOString(),
          connector: 'webchat',
          pending: result.pending ?? undefined,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Failed to reach the cloud service. Please try again.',
          ts: new Date().toISOString(),
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function resolvePending(msgId: string, confirmed: boolean) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m
        let suffix: string
        if (!confirmed) {
          suffix = '\n\n✗ Cancelled.'
        } else if (m.pending?.type === 'schedule') {
          suffix = `\n\n✓ Scheduled: "${m.pending.description}"`
        } else if (m.pending?.type === 'watcher') {
          suffix = `\n\n✓ Watcher activated: "${m.pending.description}"`
        } else {
          suffix = `\n\n✓ Published \`${m.pending?.payload}\` to \`${m.pending?.topic}\``
        }
        return { ...m, content: m.content + suffix, pending: undefined }
      })
    )
  }

  const cloudInputDisabled = isSending || !isConfigured
  const localInputDisabled = isSending || !llmReady
  const inputDisabled = mode === 'local' ? localInputDisabled : cloudInputDisabled

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b shrink-0">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            BunkerAI Chat
          </h1>
          <p className="text-muted-foreground text-sm">
            Control and monitor your MQTT devices with AI.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex items-center rounded-lg border p-0.5 gap-0.5">
            <Button
              size="sm"
              variant={mode === 'cloud' ? 'default' : 'ghost'}
              className="h-7 gap-1.5 text-xs px-2.5"
              onClick={() => { setMode('cloud'); writeChatMode('cloud') }}
            >
              <Cloud className="h-3.5 w-3.5" />
              Cloud
            </Button>
            <Button
              size="sm"
              variant={mode === 'local' ? 'default' : 'ghost'}
              className="h-7 gap-1.5 text-xs px-2.5"
              onClick={() => { setMode('local'); writeChatMode('local') }}
            >
              <Cpu className="h-3.5 w-3.5" />
              Local LLM
            </Button>
          </div>

          {mode === 'cloud' && isConfigured !== null && (
            <Badge variant={isConfigured ? 'default' : 'outline'} className="gap-1">
              <span className={`h-2 w-2 rounded-full ${isConfigured ? 'bg-green-500' : 'bg-gray-400'}`} />
              {isConfigured ? 'Connected' : 'Not configured'}
            </Badge>
          )}
          {mode === 'local' && llmReady !== null && (
            <Badge variant={llmReady ? 'default' : 'outline'} className="gap-1">
              <span className={`h-2 w-2 rounded-full ${llmReady ? 'bg-green-500' : 'bg-gray-400'}`} />
              {llmReady ? llmModel || 'Ready' : 'Not configured'}
            </Badge>
          )}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearHistory}
              title="Clear chat history (/reset)"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Not configured callouts */}
      {mode === 'cloud' && isConfigured === false && (
        <div className="flex gap-3 rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground mt-4 shrink-0">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Set up BunkerAI Cloud in{' '}
            <a href="/settings/connectors" className="underline hover:text-foreground">
              Settings → Integrations
            </a>{' '}
            to use cloud AI chat.
          </p>
        </div>
      )}

      {mode === 'local' && llmReady === false && (
        <div className="flex gap-3 rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground mt-4 shrink-0">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Configure LM Studio in{' '}
            <a href="/settings/connectors" className="underline hover:text-foreground">
              Settings → Integrations
            </a>
            {': '}
            enter the LM Studio URL, fetch models, select one, enable it, and save.
          </p>
        </div>
      )}

      {/* Message area */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
        {messages.length === 0 && (mode === 'cloud' ? isConfigured : llmReady) && (
          <div className="text-center text-muted-foreground text-sm pt-8">
            <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p>Ask anything about your broker.</p>
            <p className="text-xs mt-1 opacity-70">
              Try: &quot;What topics are active?&quot; or &quot;Publish &apos;on&apos; to home/light/1&quot;
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} userId={userId} onResolvePending={resolvePending} />
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Thinking…
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t pt-4 pb-2 shrink-0">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === 'local'
                ? 'Ask your local LLM… (Enter to send, Shift+Enter for newline)'
                : 'Ask anything about your broker… (Enter to send, Shift+Enter for newline)'
            }
            rows={2}
            disabled={inputDisabled}
            className="resize-none text-sm flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={inputDisabled || !input.trim()}
            size="icon"
            className="shrink-0 h-[4.5rem]"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
