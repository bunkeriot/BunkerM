import { generateNonce } from './utils'
import type { MqttClient, Role, Group } from '@/types'

// The Python dynsec API's list endpoints return the raw mosquitto_ctrl stdout
// as a plain string (e.g. {"clients": "name1\nname2\n..."}).
// These helpers parse that into properly typed arrays.
function parseNameList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean)
  if (typeof raw !== 'string' || !raw.trim()) return []
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.includes(':') && !l.startsWith('-'))
}

function parseClients(res: unknown): MqttClient[] {
  const raw = (res as Record<string, unknown>)?.clients ?? res
  return parseNameList(raw).map((username) => ({ username }))
}

function parseRoles(res: unknown): Role[] {
  const raw = (res as Record<string, unknown>)?.roles ?? res
  return parseNameList(raw).map((rolename) => ({ rolename }))
}

function parseGroups(res: unknown): Group[] {
  const raw = (res as Record<string, unknown>)?.groups ?? res
  return parseNameList(raw).map((groupname) => ({ groupname }))
}

// These defaults use relative paths so they work through nginx when served inside
// the container. Override via env vars for direct development access.
const DYNSEC_API_URL = process.env.NEXT_PUBLIC_DYNSEC_API_URL || '/api/dynsec'
const MONITOR_API_URL = process.env.NEXT_PUBLIC_MONITOR_API_URL || '/api/monitor'
const AWS_BRIDGE_API_URL = process.env.NEXT_PUBLIC_AWS_BRIDGE_API_URL || '/api/aws-bridge'
const AZURE_BRIDGE_API_URL = process.env.NEXT_PUBLIC_AZURE_BRIDGE_API_URL || '/api/azure-bridge'
const CONFIG_API_URL = process.env.NEXT_PUBLIC_CONFIG_API_URL || '/api/config'
const CLIENTLOGS_API_URL = process.env.NEXT_PUBLIC_CLIENTLOGS_API_URL || '/api/clientlogs'
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || ''

function buildUrl(base: string, path: string): string {
  const nonce = generateNonce()
  const timestamp = Date.now()
  const url = `${base}${path}`
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}nonce=${nonce}&timestamp=${timestamp}`
}

function getHeaders(extra?: Record<string, string>): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    ...extra,
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options?.headers as Record<string, string> || {}),
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `HTTP ${response.status}`)
  }

  const text = await response.text()
  if (!text) return {} as T
  return JSON.parse(text) as T
}

// ─── DynSec API ─────────────────────────────────────────────────────────────
// Nginx: /api/dynsec/* → localhost:1000/api/v1/*
// So paths here are relative to /api/v1/ on the Python service.

export const dynsecApi = {
  // Clients
  getClients: () => request(buildUrl(DYNSEC_API_URL, '/clients')).then(parseClients),
  getClient: (username: string) => request(buildUrl(DYNSEC_API_URL, `/clients/${username}`)),
  createClient: (data: { username: string; password: string }) =>
    request(buildUrl(DYNSEC_API_URL, '/clients'), {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteClient: (username: string) =>
    request(buildUrl(DYNSEC_API_URL, `/clients/${username}`), { method: 'DELETE' }),

  enableClient: (username: string) =>
    request(buildUrl(DYNSEC_API_URL, `/clients/${username}/enable`), { method: 'PUT' }),
  disableClient: (username: string) =>
    request(buildUrl(DYNSEC_API_URL, `/clients/${username}/disable`), { method: 'PUT' }),

  // Client roles
  addClientRole: (username: string, rolename: string) =>
    request(buildUrl(DYNSEC_API_URL, `/clients/${username}/roles`), {
      method: 'POST',
      body: JSON.stringify({ role_name: rolename }),
    }),
  removeClientRole: (username: string, rolename: string) =>
    request(buildUrl(DYNSEC_API_URL, `/clients/${username}/roles/${rolename}`), {
      method: 'DELETE',
    }),

  // Client groups
  addClientToGroup: (groupname: string, username: string, priority?: number) =>
    request(buildUrl(DYNSEC_API_URL, `/groups/${groupname}/clients`), {
      method: 'POST',
      body: JSON.stringify({ username, ...(priority !== undefined && { priority }) }),
    }),
  removeClientFromGroup: (groupname: string, username: string) =>
    request(buildUrl(DYNSEC_API_URL, `/groups/${groupname}/clients/${username}`), {
      method: 'DELETE',
    }),

  // Roles
  getRoles: () => request(buildUrl(DYNSEC_API_URL, '/roles')).then(parseRoles),
  getRole: (rolename: string) => request(buildUrl(DYNSEC_API_URL, `/roles/${rolename}`)),
  createRole: (data: { name: string }) =>
    request(buildUrl(DYNSEC_API_URL, '/roles'), {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteRole: (rolename: string) =>
    request(buildUrl(DYNSEC_API_URL, `/roles/${rolename}`), { method: 'DELETE' }),

  // Role ACLs
  addRoleACL: (rolename: string, acl: { topic: string; aclType: string; permission: string }) =>
    request(buildUrl(DYNSEC_API_URL, `/roles/${rolename}/acls`), {
      method: 'POST',
      body: JSON.stringify(acl),
    }),
  removeRoleACL: (rolename: string, aclType: string, topic: string) => {
    const encoded = encodeURIComponent(topic)
    return request(
      buildUrl(DYNSEC_API_URL, `/roles/${rolename}/acls`) + `&acl_type=${aclType}&topic=${encoded}`,
      { method: 'DELETE' }
    )
  },

  // Groups
  getGroups: () => request(buildUrl(DYNSEC_API_URL, '/groups')).then(parseGroups),
  getGroup: (groupname: string) => request(buildUrl(DYNSEC_API_URL, `/groups/${groupname}`)),
  createGroup: (data: { name: string }) =>
    request(buildUrl(DYNSEC_API_URL, '/groups'), {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteGroup: (groupname: string) =>
    request(buildUrl(DYNSEC_API_URL, `/groups/${groupname}`), { method: 'DELETE' }),

  // Group roles
  addGroupRole: (groupname: string, rolename: string) =>
    request(buildUrl(DYNSEC_API_URL, `/groups/${groupname}/roles`), {
      method: 'POST',
      body: JSON.stringify({ role_name: rolename }),
    }),
  removeGroupRole: (groupname: string, rolename: string) =>
    request(buildUrl(DYNSEC_API_URL, `/groups/${groupname}/roles/${rolename}`), {
      method: 'DELETE',
    }),

  // Password import — nginx has a dedicated location for this exact path
  importPassword: (formData: FormData) =>
    fetch(`/api/dynsec/import-password-file?nonce=${generateNonce()}&t=${Date.now()}`, {
      method: 'POST',
      headers: { 'X-API-Key': API_KEY },
      body: formData,
    }),
}

// ─── Monitor API ─────────────────────────────────────────────────────────────
// Nginx: /api/monitor/* → localhost:1001/api/v1/*

export const monitorApi = {
  getStats: () => request(buildUrl(MONITOR_API_URL, '/stats')),

  // Logs are read server-side by Next.js API routes (mirroring the old auth-api)
  getBrokerLogs: () => request<{ logs: string[] }>('/api/logs/broker'),
  getClientLogs: () => request<{ logs: string[] }>('/api/logs/clients'),
}

// ─── Config API ──────────────────────────────────────────────────────────────
// Nginx: /api/config/* → localhost:1005/api/v1/*
// Vue frontend uses absolute paths like /api/config/mosquitto-config

export const configApi = {
  getMosquittoConfig: () =>
    request<{ config: string; content: string }>(
      `/api/config/mosquitto-config?nonce=${generateNonce()}&t=${Date.now()}`
    ),
  saveMosquittoConfig: (configData: unknown) =>
    request(`/api/config/mosquitto-config?nonce=${generateNonce()}&t=${Date.now()}`, {
      method: 'POST',
      body: JSON.stringify(configData),
    }),
  resetMosquittoConfig: () =>
    request(`/api/config/reset-mosquitto-config?nonce=${generateNonce()}&t=${Date.now()}`, {
      method: 'POST',
    }),

  getDynSecJson: () =>
    request(`/api/config/dynsec-json?nonce=${generateNonce()}&t=${Date.now()}`),
  importDynSecJson: (formData: FormData) =>
    fetch(`/api/config/import-dynsec-json?nonce=${generateNonce()}&t=${Date.now()}`, {
      method: 'POST',
      headers: { 'X-API-Key': API_KEY },
      body: formData,
    }),
  exportDynSecJson: () =>
    fetch(`/api/config/export-dynsec-json?nonce=${generateNonce()}&t=${Date.now()}`, {
      headers: { 'X-API-Key': API_KEY, Accept: 'application/json' },
    }),
  resetDynSecJson: () =>
    request(`/api/config/reset-dynsec-json?nonce=${generateNonce()}&t=${Date.now()}`, {
      method: 'POST',
    }),
}

// ─── AWS Bridge API ──────────────────────────────────────────────────────────
// Nginx: /api/aws-bridge/* → localhost:1003/api/v1/*

export const awsApi = {
  getConfig: () => request(buildUrl(AWS_BRIDGE_API_URL, '/config')),
  saveConfig: (formData: FormData) =>
    fetch(buildUrl(AWS_BRIDGE_API_URL, '/config'), {
      method: 'POST',
      headers: { 'X-API-Key': API_KEY },
      body: formData,
    }),
}

// ─── Azure Bridge API ────────────────────────────────────────────────────────
// Nginx: /api/azure-bridge/* → localhost:1004/api/v1/*

export const azureApi = {
  getConfig: () => request(buildUrl(AZURE_BRIDGE_API_URL, '/config')),
  saveConfig: (data: unknown) =>
    request(buildUrl(AZURE_BRIDGE_API_URL, '/config'), {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// ─── Client Logs API ─────────────────────────────────────────────────────────
// Nginx: /api/clientlogs/* → localhost:1002/api/v1/*

export const clientlogsApi = {
  getEvents: () => request<{ events: unknown[] }>(buildUrl(CLIENTLOGS_API_URL, '/events')),
  getConnectedClients: () => request<{ clients: unknown[] }>(buildUrl(CLIENTLOGS_API_URL, '/connected-clients')),
  enableClient: (username: string) =>
    request(buildUrl(CLIENTLOGS_API_URL, `/enable/${encodeURIComponent(username)}`), { method: 'POST' }),
  disableClient: (username: string) =>
    request(buildUrl(CLIENTLOGS_API_URL, `/disable/${encodeURIComponent(username)}`), { method: 'POST' }),
}
