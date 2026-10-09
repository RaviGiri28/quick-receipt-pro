import { Link } from 'react-router-dom';
import { ArrowRight, Pin, X } from 'lucide-react';
import type { Announcement } from '@/lib/api';
import { announcementMeta } from '@/lib/blog';
import { cn } from '@/lib/utils';

type AnnouncementLike = Pick<Announcement, 'title' | 'message' | 'type' | 'link_url' | 'link_label' | 'pinned'>;

export function AnnouncementLink({ url, label }: { url: string; label?: string | null }) {
  const className = 'group inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline';
  const content = <>{label || 'Learn more'} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></>;
  return url.startsWith('/')
    ? <Link to={url} className={className}>{content}</Link>
    : <a href={url} target="_blank" rel="noopener noreferrer" className={className}>{content}</a>;
}

export function AnnouncementCard({ announcement: a, onDismiss, className }: {
  announcement: AnnouncementLike;
  onDismiss?: () => void;
  className?: string;
}) {
  const meta = announcementMeta(a.type);
  return (
    <div className={cn('relative flex items-start gap-4 rounded-2xl border p-4 sm:p-5', meta.card, className)}>
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', meta.iconClass)}>
        <meta.icon className="h-5 w-5" />
      </div>
      <div className={cn('min-w-0 flex-1', onDismiss && 'pr-6')}>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-navy">{a.title || 'Announcement title'}</h3>
          {a.pinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-card/80 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              <Pin className="h-3 w-3" /> Pinned
            </span>
          )}
        </div>
        <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">
          {a.message || 'Your message will appear here.'}
        </p>
        {a.link_url && <div className="mt-2"><AnnouncementLink url={a.link_url} label={a.link_label} /></div>}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
