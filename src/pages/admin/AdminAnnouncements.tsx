import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Loader2, Megaphone, PenSquare, Pin, Plus, Rocket, Save, Trash2 } from 'lucide-react';
import { adminApi, errorMessage, type AdminAnnouncement, type AnnouncementInput, type PublishStatus } from '@/lib/api';
import { ANNOUNCEMENT_TYPES, formatPostDate } from '@/lib/blog';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/PageHeader';
import { Field } from '@/components/FormSection';
import { EmptyState, Spinner } from '@/components/EmptyState';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { PublishBadge } from '@/pages/admin/AdminBlog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const MESSAGE_MAX = 1000;

const blank: AnnouncementInput = {
  title: '', message: '', type: 'info', link_url: '', link_label: '', pinned: false, status: 'published', expires_at: null,
};

const toInput = (a: AdminAnnouncement): AnnouncementInput => ({
  title: a.title,
  message: a.message,
  type: a.type,
  link_url: a.link_url || '',
  link_label: a.link_label || '',
  pinned: a.pinned,
  status: a.status,
  expires_at: a.expires_at ? a.expires_at.slice(0, 10) : null,
});

const isExpired = (a: AdminAnnouncement) => !!a.expires_at && new Date(a.expires_at) <= new Date();

function AnnouncementForm({ editing, onDone }: { editing: AdminAnnouncement | null; onDone: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AnnouncementInput>(editing ? toInput(editing) : blank);
  const [saving, setSaving] = useState<PublishStatus | null>(null);
  const set = <K extends keyof AnnouncementInput>(key: K, value: AnnouncementInput[K]) => setForm(prev => ({ ...prev, [key]: value }));

  const save = async (status: PublishStatus) => {
    if (form.title.trim().length < 3) {
      toast({ title: 'Add a title', description: 'Title must be at least 3 characters.', variant: 'destructive' });
      return;
    }
    if (!form.message.trim()) {
      toast({ title: 'Add a message', variant: 'destructive' });
      return;
    }
    setSaving(status);
    try {
      // The expiry date means "until the end of that day" in the admin's timezone.
      const expires = form.expires_at ? new Date(`${form.expires_at}T23:59:59`).toISOString() : null;
      const input = { ...form, status, expires_at: expires };
      if (editing) await adminApi.updateAnnouncement(editing.id, input);
      else await adminApi.createAnnouncement(input);
      queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: status === 'published' ? (editing?.status === 'published' ? 'Announcement updated' : 'Announcement published') : 'Saved as draft' });
      onDone();
    } catch (err) {
      toast({ title: 'Could not save announcement', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <Field label="Title" htmlFor="ann-title">
          <Input id="ann-title" value={form.title} onChange={e => set('title', e.target.value)} maxLength={150} placeholder="e.g. Scheduled maintenance tonight" />
        </Field>
        <Field label="Message" htmlFor="ann-message">
          <Textarea id="ann-message" rows={4} value={form.message} onChange={e => set('message', e.target.value)} maxLength={MESSAGE_MAX} placeholder="What should users know?" />
          <p className="text-right text-xs text-muted-foreground">{form.message.length} / {MESSAGE_MAX}</p>
        </Field>
        <Field label="Type">
          <div className="grid grid-cols-3 gap-2">
            {ANNOUNCEMENT_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => set('type', t.value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all',
                  form.type === t.value ? cn(t.card, 'ring-2 ring-primary/20') : 'text-muted-foreground hover:bg-accent/50',
                )}
              >
                <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', t.iconClass)}><t.icon className="h-4 w-4" /></span>
                {t.label}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Link (optional)" htmlFor="ann-link">
            <Input id="ann-link" value={form.link_url} onChange={e => set('link_url', e.target.value)} maxLength={500} placeholder="/blog/my-post or https://…" />
          </Field>
          <Field label="Link text" htmlFor="ann-link-label">
            <Input id="ann-link-label" value={form.link_label} onChange={e => set('link_label', e.target.value)} maxLength={50} placeholder="Learn more" disabled={!form.link_url.trim()} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hide after (optional)" htmlFor="ann-expires">
            <Input id="ann-expires" type="date" value={form.expires_at || ''} onChange={e => set('expires_at', e.target.value || null)} />
          </Field>
          <label htmlFor="ann-pinned" className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 sm:mt-7">
            <span>
              <span className="block text-sm font-semibold text-navy">Pin to top</span>
              <span className="block text-xs text-muted-foreground">Users can't dismiss it</span>
            </span>
            <Switch id="ann-pinned" checked={form.pinned} onCheckedChange={v => set('pinned', v)} />
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-navy">Preview on dashboard</p>
          <AnnouncementCard announcement={form} />
        </div>
        <div className="space-y-2 rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
          Publishing shows it on every user's dashboard and sends them a notification.
        </div>
        <Button className="w-full" onClick={() => save('published')} disabled={saving !== null}>
          {saving === 'published' ? <Loader2 className="animate-spin" /> : <Rocket />}
          {editing?.status === 'published' ? 'Update' : 'Publish'}
        </Button>
        <Button className="w-full" variant="outline" onClick={() => save('draft')} disabled={saving !== null}>
          {saving === 'draft' ? <Loader2 className="animate-spin" /> : <Save />}
          {editing?.status === 'published' ? 'Unpublish' : 'Save as draft'}
        </Button>
      </div>
    </div>
  );
}

export default function AdminAnnouncementsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<AdminAnnouncement | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AdminAnnouncement | null>(null);
  const { data: items, isLoading } = useQuery({ queryKey: ['admin', 'announcements'], queryFn: adminApi.listAnnouncements });

  const remove = useMutation({
    mutationFn: (id: number) => adminApi.deleteAnnouncement(id),
    onSuccess: () => {
      toast({ title: 'Announcement deleted' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: err => toast({ title: 'Could not delete', description: errorMessage(err), variant: 'destructive' }),
    onSettled: () => setToDelete(null),
  });

  const openForm = (a: AdminAnnouncement | null) => {
    setEditing(a);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        className="animate-fade-in-up"
        icon={Megaphone}
        eyebrow="Admin"
        title="Announcements"
        description="Short messages shown on every user's dashboard"
        actions={<Button onClick={() => openForm(null)}><Plus /> New Announcement</Button>}
      />

      <div className="card-soft overflow-hidden animate-fade-in-up">
        {isLoading && <Spinner />}
        {!isLoading && !items?.length && (
          <EmptyState
            icon={Megaphone}
            title="No announcements yet"
            description="Use announcements for maintenance notices, offers or quick heads-ups."
            action={<Button onClick={() => openForm(null)}><Plus /> New Announcement</Button>}
          />
        )}
        <div className="divide-y">
          {items?.map(a => (
            <div key={a.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {isExpired(a)
                    ? <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">Expired</span>
                    : <PublishBadge status={a.status} />}
                  {a.pinned && <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"><Pin className="h-3 w-3" /> Pinned</span>}
                  {a.expires_at && !isExpired(a) && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="h-3 w-3" /> Until {formatPostDate(a.expires_at)}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {a.published_at ? `· Published ${formatPostDate(a.published_at)}` : `· Created ${formatPostDate(a.created_at)}`}
                  </span>
                </div>
                <AnnouncementCard announcement={a} className={cn(isExpired(a) || a.status === 'draft' ? 'opacity-60' : '')} />
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={() => openForm(a)}><PenSquare /> Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => setToDelete(a)} className="text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label="Delete announcement">
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit announcement' : 'New announcement'}</DialogTitle>
            <DialogDescription>Shown at the top of the dashboard for all logged-in users.</DialogDescription>
          </DialogHeader>
          {formOpen && <AnnouncementForm key={editing?.id ?? 'new'} editing={editing} onDone={() => setFormOpen(false)} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={o => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this announcement?</AlertDialogTitle>
            <AlertDialogDescription>"{toDelete?.title}" will disappear from dashboards and notifications.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={e => { e.preventDefault(); if (toDelete) remove.mutate(toDelete.id); }}
              disabled={remove.isPending}
            >
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
