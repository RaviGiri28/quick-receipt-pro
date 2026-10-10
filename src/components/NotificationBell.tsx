import { useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck, Megaphone, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  useMarkAllRead, useMarkRead, useNotificationList, useUnreadCount, notificationHref,
} from '@/hooks/use-notifications';
import type { AppNotification } from '@/lib/api';
import { cn } from '@/lib/utils';
import { badgeText } from '@/lib/blog';

export function NotificationItem({ n, onOpen, compact }: { n: AppNotification; onOpen: () => void; compact?: boolean }) {
  const Icon = n.type === 'blog' ? Newspaper : Megaphone;
  return (
    <button
      onClick={onOpen}
      className={cn(
        'group flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-accent',
        !n.read && 'bg-primary/[0.05]',
      )}
    >
      <span className={cn('icon-tile h-9 w-9', n.read && 'bg-muted text-muted-foreground')}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={cn('truncate text-sm text-navy', n.read ? 'font-medium' : 'font-bold')}>{n.title}</span>
          {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
        </span>
        <span className={cn('mt-0.5 block text-xs text-muted-foreground', compact ? 'line-clamp-2' : 'whitespace-pre-line')}>{n.body}</span>
        <span className="mt-1 block text-[11px] font-medium text-muted-foreground/80">
          {n.type === 'blog' ? 'Blog' : 'Announcement'} · {formatDistanceToNow(new Date(n.published_at), { addSuffix: true })}
        </span>
      </span>
    </button>
  );
}

// Bell in the app header: unread badge and a dropdown with the latest notifications.
export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: count = 0 } = useUnreadCount();
  const { data: items, isLoading } = useNotificationList(open);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const openItem = (n: AppNotification) => {
    trackEvent('notification_open', { type: n.type, from: 'bell' });
    if (!n.read) markRead.mutate({ type: n.type, id: n.id });
    setOpen(false);
    navigate(notificationHref(n));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full text-navy hover:bg-accent"
          aria-label={count ? `Notifications, ${count} unread` : 'Notifications'}
        >
          <Bell className={cn('!h-5 !w-5', count > 0 && 'origin-top animate-[bell-ring_1.2s_ease-in-out_1]')} />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground ring-2 ring-background">
              {badgeText(count)}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="font-bold text-navy">Notifications</p>
            <p className="text-xs text-muted-foreground">{count ? `${count} unread` : 'You are all caught up'}</p>
          </div>
          {count > 0 && (
            <Button size="sm" variant="ghost" className="text-primary" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
              <CheckCheck /> Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[22rem] overflow-y-auto p-2">
          {isLoading && <div className="space-y-2 p-2">{[0, 1, 2].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />)}</div>}
          {!isLoading && items?.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">No notifications yet.</p>
          )}
          {items?.slice(0, 6).map(n => <NotificationItem key={`${n.type}-${n.id}`} n={n} onOpen={() => openItem(n)} compact />)}
        </div>
        <div className="border-t p-2">
          <Button asChild variant="ghost" className="w-full text-primary" onClick={() => setOpen(false)}>
            <Link to="/notifications">View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
