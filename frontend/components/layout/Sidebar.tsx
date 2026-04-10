'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Shield,
  UsersRound,
  FileText,
  Activity,
  Settings,
  ChevronRight,
  Wifi,
  Tag,
  Sparkles,
  MessageSquare,
  UserCog,
  Cable,
  Server,
  Bot,
  History,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/contexts/AuthContext'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Connected Clients', href: '/mqtt/connected-clients', icon: Wifi },
    ],
  },
  {
    title: 'ACL',
    items: [
      { label: 'Clients', href: '/mqtt/clients', icon: Users },
      { label: 'Roles', href: '/mqtt/roles', icon: Shield },
      { label: 'Groups', href: '/mqtt/groups', icon: UsersRound },
    ],
  },

  {
    title: 'Tools',
    items: [
      { label: 'Agents', href: '/ai/agents', icon: Bot },
      { label: 'Anomalies', href: '/ai/monitoring', icon: Activity },
  
    ],
  },
    {
    title: 'Logs',
    items: [
      { label: 'Broker Logs',      href: '/mqtt/broker-logs', icon: FileText },
      { label: 'Client Logs',      href: '/mqtt/client-logs', icon: Activity },
      { label: 'Message History',  href: '/mqtt/history',     icon: History  },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Broker', href: '/settings/', icon: Server },
      { label: 'Integrations', href: '/settings/connectors', icon: Cable },
      { label: 'Annotations', href: '/ai/annotations', icon: Tag },
      { label: 'Subscription', href: '/settings/credits', icon: Sparkles },
    ],
  },

]

interface SidebarProps {
  className?: string
  onNavClick?: () => void
}

export function Sidebar({ className, onNavClick }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const activeItem = navGroups
    .flatMap((group) => group.items)
    .reduce<NavItem | undefined>((best, item) => {
      if (pathname === item.href) return item
      if (pathname.startsWith(item.href + '/')) {
        if (!best) return item
        return item.href.length > best.href.length ? item : best
      }
      return best
    }, undefined)

  const activeHref = activeItem?.href

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'flex flex-col h-full bg-sidebar text-sidebar-foreground',
          className
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-sidebar-border">
          <Image src="/BunkerM_Logo.png" alt="BunkerM" width={32} height={32} className="rounded-lg" />
          <span className="font-bold text-lg">BunkerM</span>
        </div>

        {/* Bunker AI Button */}
        <div className="p-3">
          <Link
            href="/ai/chat"
            className="flex items-center justify-center gap-2 w-full bg-sidebar-primary text-sidebar-primary-foreground rounded-lg py-2.5 px-3 font-medium text-sm hover:opacity-90 transition-opacity"
            onClick={onNavClick}
          >
            <Sparkles className="h-4 w-4" />
            Ask BunkerAI          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-2 mb-2">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = item.href === activeHref
                  const Icon = item.icon
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavClick}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                        {isActive && <ChevronRight className="ml-auto h-3 w-3" />}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}

          {isAdmin && (
            <div>
              <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-2 mb-2">
                Admin
              </p>
              <ul className="space-y-0.5">
                {[{ label: 'Users', href: '/admin/users', icon: UserCog }].map((item) => {
                  const isActive = item.href === activeHref
                  const Icon = item.icon
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavClick}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                        {isActive && <ChevronRight className="ml-auto h-3 w-3" />}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/40 text-center">
            BunkerM Community {process.env.NEXT_PUBLIC_CURRENT_VERSION || 'v2.0.0'}
          </p>
        </div>
      </aside>
    </TooltipProvider>
  )
}
