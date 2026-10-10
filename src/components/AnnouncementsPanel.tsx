import { useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import { useQuery } from '@tanstack/react-query';
import { Megaphone } from 'lucide-react';
import { announcementsApi } from '@/lib/api';
import { useMarkRead } from '@/hooks/use-notifications';
import { AnnouncementCard } from '@/components/AnnouncementCard';

const DISMISSED_KEY = 'qr_dismissed_announcements';

// Dismissing only hides an announcement on this device; pinned ones can't be dismissed.
function loadDismissed(): number[] {
  try {
    const value = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveDismissed(ids: number[]) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids.slice(-100)));
  } catch {
    // Storage unavailable: the announcement just reappears next visit.
  }
}

export function AnnouncementsPanel() {
  const { data } = useQuery({ queryKey: ['announcements'], queryFn: announcementsApi.active, refetchOnWindowFocus: true });
  const [dismissed, setDismissed] = useState(loadDismissed);
  const markRead = useMarkRead();

  const visible = (data || []).filter(a => a.pinned || !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  const dismiss = (id: number) => {
    const next = [...dismissed, id];
    setDismissed(next);
    saveDismissed(next);
    markRead.mutate({ type: 'announcement', id });
    trackEvent('announcement_dismiss');
  };

  return (
    <section id="announcements" className="space-y-3 animate-fade-in-up" aria-label="Announcements">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Megaphone className="h-4 w-4 text-primary" /> Announcements
      </div>
      <div className="stagger space-y-3">
        {visible.map(a => (
          <AnnouncementCard key={a.id} announcement={a} onDismiss={a.pinned ? undefined : () => dismiss(a.id)} />
        ))}
      </div>
    </section>
  );
}
