import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Newspaper, PenSquare, Plus, Trash2 } from 'lucide-react';
import { adminApi, errorMessage, type AdminBlogPost } from '@/lib/api';
import { formatPostDate, visibilityMeta } from '@/lib/blog';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, Spinner } from '@/components/EmptyState';
import { TagBadge } from '@/components/TagBadge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'published' | 'draft';

export function PublishBadge({ status }: { status: 'draft' | 'published' }) {
  const live = status === 'published';
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
      live ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground',
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', live ? 'bg-emerald-500' : 'bg-muted-foreground/60')} />
      {live ? 'Published' : 'Draft'}
    </span>
  );
}

function PostRow({ post, onDelete }: { post: AdminBlogPost; onDelete: () => void }) {
  const vis = visibilityMeta(post.visibility);
  return (
    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="h-20 w-full shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary/15 via-accent to-card sm:w-32">
        {post.cover_image
          ? <img src={post.cover_image} alt="" className="h-full w-full object-cover" />
          : <div className="flex h-full items-center justify-center"><Newspaper className="h-7 w-7 text-primary/30" /></div>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <PublishBadge status={post.status} />
          <TagBadge tag={post.tag} />
          <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            <vis.icon className="h-3 w-3" /> {vis.label}
          </span>
        </div>
        <Link to={`/admin/blog/${post.id}/edit`} className="mt-2 block truncate text-lg font-bold text-navy hover:text-primary">
          {post.title}
        </Link>
        <p className="text-xs text-muted-foreground">
          {post.status === 'published' ? `Published ${formatPostDate(post.published_at)}` : `Last edited ${formatPostDate(post.updated_at)}`}
          {post.author_name && ` · ${post.author_name}`}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        {post.status === 'published' && (
          <Button size="sm" variant="ghost" asChild><Link to={`/blog/${post.slug}`}><Eye /> View</Link></Button>
        )}
        <Button size="sm" variant="outline" asChild><Link to={`/admin/blog/${post.id}/edit`}><PenSquare /> Edit</Link></Button>
        <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label="Delete post">
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}

export default function AdminBlogPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');
  const [toDelete, setToDelete] = useState<AdminBlogPost | null>(null);
  const { data: posts, isLoading } = useQuery({ queryKey: ['admin', 'posts'], queryFn: adminApi.listPosts });

  const remove = useMutation({
    mutationFn: (id: number) => adminApi.deletePost(id),
    onSuccess: () => {
      toast({ title: 'Post deleted' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: err => toast({ title: 'Could not delete post', description: errorMessage(err), variant: 'destructive' }),
    onSettled: () => setToDelete(null),
  });

  const counts = {
    all: posts?.length || 0,
    published: posts?.filter(p => p.status === 'published').length || 0,
    draft: posts?.filter(p => p.status === 'draft').length || 0,
  };
  const visible = (posts || []).filter(p => filter === 'all' || p.status === filter);

  return (
    <div className="space-y-6">
      <PageHeader
        className="animate-fade-in-up"
        icon={Newspaper}
        eyebrow="Admin"
        title="Blog Posts"
        description="Write updates and choose who can read them"
        actions={<Button asChild><Link to="/admin/blog/new"><Plus /> New Post</Link></Button>}
      />

      <div className="flex flex-wrap gap-2 animate-fade-in-up">
        {(['all', 'published', 'draft'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-semibold capitalize transition-all duration-200',
              filter === f ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary',
            )}
          >
            {f === 'draft' ? 'Drafts' : f} <span className="opacity-75">({counts[f]})</span>
          </button>
        ))}
      </div>

      <div className="card-soft overflow-hidden animate-fade-in-up">
        {isLoading && <Spinner />}
        {!isLoading && visible.length === 0 && (
          <EmptyState
            icon={Newspaper}
            title={filter === 'all' ? 'No posts yet' : `No ${filter === 'draft' ? 'drafts' : 'published posts'}`}
            description="Write your first update to let users know what's new."
            action={<Button asChild><Link to="/admin/blog/new"><Plus /> Write a post</Link></Button>}
          />
        )}
        <div className="divide-y">
          {visible.map(p => <PostRow key={p.id} post={p} onDelete={() => setToDelete(p)} />)}
        </div>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={o => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.title}" will be removed from the blog and from users' notifications. This can't be undone.
            </AlertDialogDescription>
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
