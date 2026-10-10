import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Clock, Link2, Newspaper, PenSquare, UserRound } from 'lucide-react';
import { blogApi, type BlogAudience } from '@/lib/api';
import { formatPostDate, readingMinutes } from '@/lib/blog';
import { useAuth } from '@/contexts/AuthContext';
import { useMarkRead } from '@/hooks/use-notifications';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';
import { Markdown } from '@/components/Markdown';
import { TagBadge } from '@/components/TagBadge';
import { EmptyState, Spinner } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';

export default function BlogPostPage({ audience }: { audience: BlogAudience }) {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['blog-post', audience, slug],
    queryFn: () => blogApi.get(audience, slug),
    retry: false,
  });

  // Opening a post clears its notification.
  const { mutate: markRead } = useMarkRead();
  useEffect(() => {
    if (post && audience === 'users') markRead({ type: 'blog', id: post.id });
  }, [post, audience, markRead]);

  const viewedId = post?.id;
  useEffect(() => {
    if (post) trackEvent('blog_post_view', { slug: post.slug, tag: post.tag, audience });
    // Once per post opened, not on every refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewedId, audience]);

  useEffect(() => {
    if (post) document.title = `${post.title} · Quick Receipt Blog`;
    return () => { document.title = 'Quick Receipt'; };
  }, [post]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied' });
    } catch {
      toast({ title: 'Could not copy the link', variant: 'destructive' });
    }
  };

  if (isLoading) return <Spinner />;
  if (isError || !post) {
    return (
      <div className="card-soft mx-auto max-w-xl">
        <EmptyState
          icon={Newspaper}
          title="Post not found"
          description="It may have been removed, or it isn't available here."
          action={<Button asChild variant="outline"><Link to="/blog"><ArrowLeft /> Back to blog</Link></Button>}
        />
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between gap-3">
        <Link to="/blog" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> All posts
        </Link>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={copyLink}><Link2 /> Copy link</Button>
          {user?.isAdmin && (
            <Button size="sm" variant="outline" asChild><Link to={`/admin/blog/${post.id}/edit`}><PenSquare /> Edit</Link></Button>
          )}
        </div>
      </div>

      <header className="space-y-4">
        <TagBadge tag={post.tag} />
        <h1 className="text-3xl font-extrabold leading-tight text-navy sm:text-4xl">{post.title}</h1>
        <p className="text-lg text-muted-foreground">{post.summary}</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {formatPostDate(post.published_at)}</span>
          <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> {readingMinutes(post.content)} min read</span>
          {post.author_name && <span className="inline-flex items-center gap-1.5"><UserRound className="h-4 w-4" /> {post.author_name}</span>}
        </div>
      </header>

      {post.cover_image && (
        <img src={post.cover_image} alt="" className="aspect-[16/9] w-full rounded-3xl border object-cover shadow-sm" />
      )}

      <div className="card-soft p-6 sm:p-10">
        <Markdown>{post.content}</Markdown>
      </div>

      <div className="flex justify-center pt-2">
        <Button asChild variant="outline"><Link to="/blog"><ArrowLeft /> Back to all posts</Link></Button>
      </div>
    </article>
  );
}
