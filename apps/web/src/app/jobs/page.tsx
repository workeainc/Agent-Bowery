'use client';

import { ContentManager } from '@/components/auth/RoleGuard';
import { AppShell } from '@/components/layout/AppShell';
import JobQueueDashboard from '@/components/jobs/JobQueueDashboard';

export default function JobsPage() {
  return (
    <ContentManager
      fallback={
        <AppShell>
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <JobQueueDashboard />
            </div>
          </div>
        </AppShell>
      }
    >
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <JobQueueDashboard />
        </div>
      </div>
    </ContentManager>
  );
}
