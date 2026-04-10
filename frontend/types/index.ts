// Auth types
export type UserRole = 'admin' | 'user'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  country?: string
  createdAt: string
  role: UserRole
}

export interface UserWithHash extends User {
  passwordHash: string
  recoveryToken?: string
  recoveryExpiry?: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
}

// MQTT Client types
export interface MqttClient {
  username: string
  disabled?: boolean
  roles?: ClientRole[]
  groups?: ClientGroup[]
}

export interface ClientRole {
  rolename: string
}

export interface ClientGroup {
  groupname: string
  priority?: number
}

// Role types
export interface Role {
  rolename: string
  acls?: ACL[]
}

export interface ACL {
  aclType: string
  topic: string
  priority?: number
  permission: string  // "allow" | "deny"
}

// Group types
export interface Group {
  groupname: string
  roles?: ClientRole[]
  clients?: ClientWithPriority[]
}

export interface ClientWithPriority {
  username: string
  priority?: number
}

// Monitor/Dashboard types — mirrors the Python monitor API response
export interface MonitorStats {
  total_connected_clients: number
  total_messages_received: string   // formatted string e.g. "1.2K"
  total_subscriptions: number
  retained_messages: number
  messages_history: number[]
  published_history: number[]
  bytes_stats: {
    timestamps: string[]
    bytes_received: number[]
    bytes_sent: number[]
  }
  daily_message_stats: {
    dates: string[]
    counts: number[]
  }
  mqtt_connected?: boolean
  connection_error?: string
}

export interface ChartDataPoint {
  time: string
  bytesSent: number
  bytesReceived: number
}

export interface MessageDataPoint {
  date: string
  count: number
}

// Bridge types
export interface AwsBridgeConfig {
  enabled: boolean
  host: string
  port: number
  clientId: string
  topic: string
  caFile?: string
  certFile?: string
  keyFile?: string
}

export interface AzureBridgeConfig {
  enabled: boolean
  connectionString: string
  topic: string
  hubName?: string
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

// MQTT Event (from clientlogs service)
export interface MQTTEvent {
  id: string
  timestamp: string
  event_type: string
  client_id: string
  details: string
  status: string
  protocol_level: string
  clean_session: boolean
  keep_alive: number
  username: string
  ip_address: string
  port: number
}

// MQTT Browser types
export interface MqttTopic {
  topic: string
  value: string
  timestamp: string
  count: number
  retained: boolean
  qos: number
}

// Log types
export interface LogEntry {
  timestamp: string
  level?: string
  message: string
  raw: string
}

// ── BunkerM Cloud types ───────────────────────────────────────────────────────

export interface CloudStatus {
  configured: boolean
  connected: boolean
  tier?: 'premium' | 'enterprise'
  tenant_id?: string
  connected_at?: string
}

export interface TopicAnnotation {
  topic: string
  description: string
  direction: 'read' | 'write' | 'both'
  example_payloads: string[]
  updated_at: string
}

// ── AI Chat types ─────────────────────────────────────────────────────────────

export interface PendingAction {
  id: string
  type?: 'publish' | 'schedule' | 'watcher'
  // publish fields
  topic?: string
  payload?: string
  qos?: number
  retain?: boolean
  // schedule / watcher fields
  description?: string
  cron?: string
  condition_operator?: string
  condition_value?: string
}

export interface ScheduledJob {
  id: string
  description: string
  cron: string
  topic: string
  payload: string
  qos: number
  retain: boolean
  active: boolean
  created_by: string
  created_at: string
  last_fired_at: string | null
  fire_count: number
}

export interface Watcher {
  id: string
  description: string
  topic: string
  condition_field: string | null
  condition_operator: string
  condition_value: string
  response_template: string
  one_shot: boolean
  cooldown_seconds: number
  expires_after_days: number | null
  created_by: string
  created_at: string
  last_fired_at: string | null
  fire_count: number
  active: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: string
  connector?: string      // 'webchat' | 'telegram' | 'slack' — attribution from shared history
  pending?: PendingAction
}

// ── Subscription types ────────────────────────────────────────────────────────

export interface SubscriptionData {
  plan: string
  plan_label: string
  subscription_status: string   // 'active' | 'trialing' | 'past_due' | 'canceled'
  interactions_used: number
  interactions_limit: number | null   // null = unlimited
  interactions_reset_at: string | null
  allowed_connectors: string[]
  agents_limit: number | null         // null = unlimited
  max_instances: number
  price_eur: number | null            // null = contact us; prices are in EUR
  country: string | null              // ISO-2 code or full name
  email_verified: boolean
}

// ── Message History & Replay types ───────────────────────────────────────────

export interface HistoryMessage {
  id: number
  ts: number
  topic: string
  payload: string | null
  enc: 'utf8' | 'base64'
  qos: number
  retain: number
  size: number
}

export interface HistoryTopic {
  topic: string
  count: number
  last_seen: number
}

export interface HistoryStats {
  total: number
  oldest_ts: number | null
  newest_ts: number | null
  db_size_bytes: number
  max_messages: number
  max_age_days: number
}

export interface HistoryQuery {
  topic?: string
  search?: string
  from_ts?: number
  to_ts?: number
  limit?: number
  offset?: number
}

// ── Smart Anomaly Detection types ────────────────────────────────────────────

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'
export type AnomalyType = 'z_score' | 'ewma' | 'spike' | 'silence'

export interface AiAlert {
  id: string
  entity_type: string
  entity_id: string
  anomaly_type: AnomalyType
  severity: AlertSeverity
  description: string
  acknowledged: boolean
  created_at: string
}

export interface AiAnomaly {
  id: string
  entity_type: string
  entity_id: string
  anomaly_type: AnomalyType
  score: number
  details: Record<string, unknown>
  detected_at: string
}

export interface MetricField {
  mean: number | null
  std: number | null
  count: number
  computed_at: string | null
}

export interface AiMetrics {
  entity_type: string
  entity_id: string
  window: string
  fields: Record<string, MetricField>
}
