'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrentPage?: boolean;
}

export default function Breadcrumb() {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with Home
    breadcrumbs.push({
      label: 'Home',
      href: '/dashboard',
      isCurrentPage: pathname === '/dashboard'
    });

    // Build breadcrumbs from path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip dashboard since we already added Home
      if (segment === 'dashboard') return;

      const isLast = index === pathSegments.length - 1;
      const label = formatSegmentLabel(segment);

      breadcrumbs.push({
        label,
        href: currentPath,
        isCurrentPage: isLast
      });
    });

    return breadcrumbs;
  };

  // Format segment labels for display
  const formatSegmentLabel = (segment: string): string => {
    // Handle common routes
    const routeLabels: Record<string, string> = {
      'content': 'Content',
      'calendar': 'Calendar',
      'inbox': 'Inbox',
      'analytics': 'Analytics',
      'platforms': 'Platforms',
      'templates': 'Templates',
      'users': 'Users',
      'settings': 'Settings',
      'admin': 'Admin',
      'auth': 'Authentication',
      'login': 'Login',
      'create': 'Create',
      'edit': 'Edit',
      'view': 'View'
    };

    return routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs on home page or if only one item
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
      {breadcrumbs.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && (
            <ChevronRightIcon className="h-4 w-4 mx-2 text-gray-400" />
          )}
          
          {index === 0 ? (
            <HomeIcon className="h-4 w-4" />
          ) : null}
          
          {item.isCurrentPage ? (
            <span className="font-medium text-gray-900">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-gray-700 transition-colors"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
