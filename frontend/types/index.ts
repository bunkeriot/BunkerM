// Auth types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  createdAt: string
}

export interface UserWithHash extends User {
  passwordHash: string
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

// Log types
export interface LogEntry {
  timestamp: string
  level?: string
  message: string
  raw: string
}
