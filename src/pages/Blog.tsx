import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Newspaper, PenSquare } from 'lucide-react';
import { blogApi, type BlogAudience, type BlogTag } from '@/lib/api';
import { BLOG_TAGS } from '@/lib/blog';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { BlogCard } from '@/components/BlogCard';
import { EmptyState } from '@/components/EmptyState';
import { Pager } from '@/components/Pager';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function BlogPage({ audience }: { audience: BlogAudience }) {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [tag, setTag] = useState<BlogTag | undefined>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['blog', audience, page, tag],
    queryFn: () => blogApi.list(audience, page, tag),
    placeholderData: keepPreviousData,
  });

  const selectTag = (value?: BlogTag) => {
    setTag(value);
    setPage(1);
  };

  const posts = data?.posts || [];
  // The newest post gets the wide card on the first, unfiltered page.
  const [featured, ...rest] = page === 1 && !tag ? posts : [undefined, ...posts];

  return (
    <div className="space-y-6">
      {audience === 'users' ? (
        <PageHeader
          className="animate-fade-in-up"
          icon={Newspaper}
          title="Blog"
          description="New features, updates and tips from the Quick Receipt Pro team"
          actions={user?.isAdmin && (
            <Button asChild><Link to="/admin/blog/new"><PenSquare /> New Post</Link></Button>
          )}
        />
      ) : (
        <div className="mx-auto max-w-2xl space-y-3 text-center animate-fade-in-up">
          <span className="chip mx-auto"><Newspaper className="h-4 w-4 text-primary" /> Quick Receipt Pro Blog</span>
          <h1 className="text-4xl font-extrabold text-navy sm:text-5xl">
            What's <span className="text-gradient">new</span>
          </h1>
          <p className="text-muted-foreground sm:text-lg">Product updates, new features and tips for running a faster counter.</p>
        </div>
      )}

      <div className={cn('flex flex-wrap gap-2 animate-fade-in-up', audience === 'public' && 'justify-center')}>
        {[{ value: undefined, label: 'All' }, ...BLOG_TAGS].map(t => (
          <button
            key={t.label}
            onClick={() => selectTag(t.value)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200',
              tag === t.value
                ? 'border-primary bg-primary text-primary-foreground shadow-[0_8px_20px_-12px_hsl(var(--primary)/0.8)]'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map(i => <div key={i} className="card-soft h-80 animate-pulse bg-muted/50" />)}
        </div>
      )}

      {!isLoading && (isError || posts.length === 0) && (
        <div className="card-soft">
          <EmptyState
            icon={Newspaper}
            title={isError ? "Couldn't load the blog" : tag ? 'No posts with this tag yet' : 'No posts yet'}
            description={isError ? 'Please check your connection and try again.' : 'New features and updates will be posted here.'}
          />
        </div>
      )}

      {featured && <div className="animate-fade-in-up"><BlogCard post={featured} featured /></div>}
      {rest.length > 0 && (
        <div className="stagger grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map(p => p && <BlogCard key={p.id} post={p} />)}
        </div>
      )}

      {data && <Pager page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} label="posts" />}
    </div>
  );
}
