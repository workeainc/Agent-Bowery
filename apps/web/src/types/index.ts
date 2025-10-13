// User and Authentication Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  roles: Role[];
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export type Role = 'admin' | 'editor' | 'viewer';

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Content Types
export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  status: ContentStatus;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  versions: ContentVersion[];
  schedules: Schedule[];
}

export type ContentType = 'BLOG' | 'NEWSLETTER' | 'SOCIAL_POST';
export type ContentStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

export interface ContentVersion {
  id: string;
  contentItemId: string;
  version: number;
  body: string;
  metadataJson: Record<string, any>;
  createdAt: string;
}

export interface Schedule {
  id: string;
  contentItemId: string;
  platform: Platform;
  scheduledAt: string;
  status: ScheduleStatus;
  targetAccountId?: string;
  targetAccountName?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export type ScheduleStatus = 'pending' | 'queued' | 'published' | 'failed' | 'cancelled';

// Platform Types
export type Platform = 'FACEBOOK' | 'INSTAGRAM' | 'LINKEDIN' | 'YOUTUBE' | 'GBP' | 'WORDPRESS' | 'MAIL';

export interface PlatformAccountInfo {
  platform: string;
  accountId: string;
  accountName: string;
  accountType: string;
  isConnected: boolean;
  permissions: string[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface CreateContentDto {
  title: string;
  type: ContentType;
  status?: ContentStatus;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateContentDto {
  title?: string;
  type?: ContentType;
  status?: ContentStatus;
  tags?: string[];
  metadata?: Record<string, any>;
}

// Analytics Types
export interface ContentMetrics {
  views: number;
  engagement: number;
  reach: number;
  clicks: number;
  shares: number;
  comments: number;
}

export interface PlatformMetrics {
  platform: Platform;
  posts: number;
  engagement: number;
  reach: number;
  followers: number;
}

// System Health Types
export interface SystemHealth {
  status: 'ok' | 'error' | 'warning';
  globalPause: boolean;
  systemStatus: 'active' | 'offline' | 'error';
  updatedAt: string;
  providers: {
    meta: boolean;
    linkedin: boolean;
    google: boolean;
  };
}

// Lead Types
export interface Lead {
  id: string;
  organizationId: string;
  source: string;
  name?: string;
  email?: string;
  phone?: string;
  score: number;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'archived';

// Notification Types
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
