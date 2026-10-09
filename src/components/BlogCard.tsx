import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Newspaper } from 'lucide-react';
import type { BlogPostSummary } from '@/lib/api';
import { formatPostDate } from '@/lib/blog';
import { TagBadge } from '@/components/TagBadge';
import { cn } from '@/lib/utils';

function Cover({ post, className }: { post: BlogPostSummary; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br from-primary/15 via-accent to-card', className)}>
      {post.cover_image ? (
        <img
          src={post.cover_image}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Newspaper className="h-12 w-12 text-primary/30 transition-transform duration-500 group-hover:scale-110" />
        </div>
      )}
    </div>
  );
}

// featured = wide card for the latest post at the top of the list.
export function BlogCard({ post, featured }: { post: BlogPostSummary; featured?: boolean }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className={cn(
        'group card-soft card-hover flex overflow-hidden',
        featured ? 'flex-col md:flex-row' : 'flex-col',
      )}
    >
      <Cover post={post} className={featured ? 'aspect-[16/9] md:aspect-auto md:w-1/2 md:min-h-[280px]' : 'aspect-[16/9]'} />
      <div className={cn('flex flex-1 flex-col p-5', featured && 'md:justify-center md:p-8')}>
        <div className="flex flex-wrap items-center gap-2">
          <TagBadge tag={post.tag} />
          {featured && <span className="text-xs font-semibold uppercase tracking-wider text-primary">Latest</span>}
        </div>
        <h2 className={cn('mt-3 font-extrabold leading-snug text-navy transition-colors group-hover:text-primary', featured ? 'text-2xl sm:text-3xl' : 'text-lg')}>
          {post.title}
        </h2>
        <p className={cn('mt-2 text-sm leading-relaxed text-muted-foreground', featured ? 'line-clamp-4 sm:text-base' : 'line-clamp-3')}>
          {post.summary}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {formatPostDate(post.published_at)}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-primary">
            Read <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
