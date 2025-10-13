'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  CalendarIcon, 
  InboxIcon, 
  ChartBarIcon, 
  CogIcon,
  UsersIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  DocumentIcon,
  BellIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { Permission, hasPermission } from '@/types/auth';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions?: Permission[];
  roles?: string[];
  badge?: string;
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    permissions: ['analytics:view'],
  },
  {
    name: 'Content',
    href: '/content',
    icon: DocumentTextIcon,
    permissions: ['content:create', 'content:edit', 'analytics:view'],
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: CalendarIcon,
    permissions: ['content:create', 'content:edit', 'content:publish'],
  },
  {
    name: 'Inbox',
    href: '/inbox',
    icon: InboxIcon,
    permissions: ['content:create', 'content:edit'],
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: ChartBarIcon,
    permissions: ['analytics:view'],
  },
  {
    name: 'Platforms',
    href: '/platforms',
    icon: GlobeAltIcon,
    permissions: ['platforms:manage'],
  },
  {
    name: 'Templates',
    href: '/templates',
    icon: DocumentIcon,
    permissions: ['templates:manage'],
  },
  {
    name: 'Users',
    href: '/users',
    icon: UsersIcon,
    permissions: ['users:manage'],
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: CogIcon,
    permissions: ['settings:manage'],
  },
  {
    name: 'Admin',
    href: '/admin',
    icon: ShieldCheckIcon,
    permissions: ['admin:access'],
  },
];

export function RoleBasedNavigation() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  // Filter navigation items based on user permissions
  const filteredItems = navigationItems.filter(item => {
    if (!item.permissions || item.permissions.length === 0) {
      return true; // No permission requirements, show to everyone
    }
    
    // User needs at least one of the required permissions
    return item.permissions.some(permission => hasPermission(user, permission));
  });

  return (
    <nav className="space-y-1">
      {filteredItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
              ${isActive
                ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-500'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }
            `}
          >
            <Icon
              className={`
                mr-3 flex-shrink-0 h-5 w-5 transition-colors
                ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}
              `}
            />
            <span className="flex-1">{item.name}</span>
            {item.badge && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

// Quick access navigation for common actions
export function QuickActions() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const quickActions: NavigationItem[] = [
    {
      name: 'Create Content',
      href: '/content/create',
      icon: DocumentTextIcon,
      permissions: ['content:create'],
    },
    {
      name: 'Schedule Post',
      href: '/content/schedule',
      icon: CalendarIcon,
      permissions: ['content:publish'],
    },
    {
      name: 'View Analytics',
      href: '/analytics',
      icon: ChartBarIcon,
      permissions: ['analytics:view'],
    },
  ];

  const availableActions = quickActions.filter(action => {
    if (!action.permissions || action.permissions.length === 0) {
      return true;
    }
    return action.permissions.some(permission => hasPermission(user, permission));
  });

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Quick Actions
      </h3>
      <nav className="mt-2 space-y-1">
        {availableActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.name}
              href={action.href}
              className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50"
            >
              <Icon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              {action.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
