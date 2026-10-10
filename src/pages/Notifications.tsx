import { useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck, Megaphone, Newspaper } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, Spinner } from '@/components/EmptyState';
import { AnnouncementLink } from '@/components/AnnouncementCard';
import { TagBadge } from '@/components/TagBadge';
import { Button } from '@/components/ui/button';
import { useMarkAllRead, useMarkRead, useNotificationList, useUnreadCount } from '@/hooks/use-notifications';
import { announcementMeta } from '@/lib/blog';
import type { AppNotification } from '@/lib/api';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'unread' | 'blog' | 'announcement';

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'blog', label: 'Blog posts' },
  { value: 'announcement', label: 'Announcements' },
];

function NotificationRow({ n, onOpen }: { n: AppNotification; onOpen: () => void }) {
  const isBlog = n.type === 'blog';
  const meta = announcementMeta(n.tag);
  const Icon = isBlog ? Newspaper : meta.icon;
  return (
    <div
      className={cn(
        'group relative flex items-start gap-4 p-4 transition-colors sm:p-5',
        !n.read && 'bg-primary/[0.04]',
        isBlog && 'cursor-pointer hover:bg-accent/60',
      )}
      onClick={isBlog ? onOpen : undefined}
    >
      {!n.read && <span className="absolute left-0 top-4 h-10 w-1 rounded-r-full bg-primary" />}
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', isBlog ? 'bg-accent text-primary' : meta.iconClass)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn('text-navy', n.read ? 'font-semibold' : 'font-extrabold')}>{n.title}</p>
          {isBlog ? <TagBadge tag={n.tag} className="py-0.5" /> : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">Announcement</span>
          )}
          {!n.read && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">New</span>}
        </div>
        <p className={cn('mt-1 text-sm leading-relaxed text-muted-foreground', isBlog ? 'line-clamp-2' : 'whitespace-pre-line break-words')}>{n.body}</p>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.published_at), { addSuffix: true })}</span>
          {isBlog && <span className="text-sm font-semibold text-primary group-hover:underline">Read post →</span>}
          {!isBlog && n.link_url && <AnnouncementLink url={n.link_url} label={n.link_label} />}
          {!isBlog && !n.read && (
            <button onClick={onOpen} className="text-sm font-semibold text-primary hover:underline">Mark as read</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const { data: items, isLoading, isError } = useNotificationList();
  const { data: count = 0 } = useUnreadCount();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const visible = (items || []).filter(n =>
    filter === 'all' ? true : filter === 'unread' ? !n.read : n.type === filter,
  );

  const open = (n: AppNotification) => {
    trackEvent('notification_open', { type: n.type, from: 'page' });
    if (!n.read) markRead.mutate({ type: n.type, id: n.id });
    if (n.type === 'blog' && n.slug) navigate(`/blog/${n.slug}`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        className="animate-fade-in-up"
        icon={Bell}
        title="Notifications"
        description={count ? `You have ${count} unread notification${count === 1 ? '' : 's'}` : 'You are all caught up'}
        actions={
          <Button variant="outline" onClick={() => markAllRead.mutate()} disabled={!count || markAllRead.isPending}>
            <CheckCheck /> Mark all as read
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 animate-fade-in-up">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200',
              filter === f.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary',
            )}
          >
            {f.label}
            {f.value === 'unread' && count > 0 && <span className="ml-1.5 opacity-80">({count})</span>}
          </button>
        ))}
      </div>

      <div className="card-soft overflow-hidden animate-fade-in-up">
        {isLoading && <Spinner />}
        {!isLoading && (isError || visible.length === 0) && (
          <EmptyState
            icon={filter === 'announcement' ? Megaphone : Bell}
            title={isError ? "Couldn't load notifications" : filter === 'unread' ? 'No unread notifications' : 'Nothing here yet'}
            description={isError ? 'Please try again in a moment.' : "New blog posts and announcements will show up here."}
          />
        )}
        <div className="divide-y">
          {visible.map(n => <NotificationRow key={`${n.type}-${n.id}`} n={n} onOpen={() => open(n)} />)}
        </div>
      </div>
    </div>
  );
}
