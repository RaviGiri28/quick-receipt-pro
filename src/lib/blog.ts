import { format } from 'date-fns';
import { Globe, Users, Layers, Info, Sparkles, AlertTriangle, type LucideIcon } from 'lucide-react';
import type { AnnouncementType, BlogTag, BlogVisibility } from '@/lib/api';

export const BLOG_TAGS: { value: BlogTag; label: string; className: string }[] = [
  { value: 'feature', label: 'New Feature', className: 'bg-primary/10 text-primary' },
  { value: 'update', label: 'Update', className: 'bg-sky-500/10 text-sky-700 dark:text-sky-400' },
  { value: 'fix', label: 'Fix', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  { value: 'announcement', label: 'Announcement', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  { value: 'guide', label: 'Guide', className: 'bg-violet-500/10 text-violet-700 dark:text-violet-400' },
];

export const tagMeta = (tag: string) => BLOG_TAGS.find(t => t.value === tag) || BLOG_TAGS[1];

export const VISIBILITY_OPTIONS: { value: BlogVisibility; label: string; desc: string; icon: LucideIcon }[] = [
  { value: 'both', label: 'Everyone', desc: 'Public website and logged-in users', icon: Layers },
  { value: 'users', label: 'Logged-in users', desc: 'Only inside the app', icon: Users },
  { value: 'public', label: 'Public website', desc: 'Only on the public blog, no notification', icon: Globe },
];

export const visibilityMeta = (v: BlogVisibility) => VISIBILITY_OPTIONS.find(o => o.value === v) || VISIBILITY_OPTIONS[0];

export const ANNOUNCEMENT_TYPES: {
  value: AnnouncementType; label: string; icon: LucideIcon; card: string; iconClass: string;
}[] = [
  {
    value: 'info', label: 'Info', icon: Info,
    card: 'border-primary/25 bg-primary/[0.06]', iconClass: 'bg-primary/15 text-primary',
  },
  {
    value: 'update', label: 'New / Update', icon: Sparkles,
    card: 'border-emerald-500/30 bg-emerald-500/[0.07]', iconClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  },
  {
    value: 'warning', label: 'Warning', icon: AlertTriangle,
    card: 'border-amber-500/35 bg-amber-500/[0.08]', iconClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  },
];

export const announcementMeta = (t: string) => ANNOUNCEMENT_TYPES.find(a => a.value === t) || ANNOUNCEMENT_TYPES[0];

// Text inside the unread badge.
export const badgeText = (count: number) => (count > 9 ? '9+' : String(count));

export const formatPostDate = (iso: string | null | undefined) => (iso ? format(new Date(iso), 'd MMM yyyy') : '');

// Rough reading time for a Markdown body.
export const readingMinutes = (markdown: string) => Math.max(1, Math.round(markdown.split(/\s+/).filter(Boolean).length / 200));
