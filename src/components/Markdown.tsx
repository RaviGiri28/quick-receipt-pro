import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Renders a blog post body. Raw HTML in the Markdown is not rendered (react-markdown's
// default), so post content can't inject scripts.
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        'prose prose-slate max-w-none dark:prose-invert',
        'prose-headings:font-extrabold prose-headings:text-navy prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        'prose-img:rounded-2xl prose-img:border prose-img:shadow-sm',
        'prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:font-medium prose-code:before:content-none prose-code:after:content-none',
        'prose-blockquote:border-l-primary prose-blockquote:not-italic',
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href = '', children, node: _node, ...props }) =>
            href.startsWith('/') ? (
              <Link to={href}>{children}</Link>
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
            ),
          img: ({ alt, node: _node, ...props }) => <img alt={alt || ''} loading="lazy" {...props} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
