import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Bold, Code, Eye, Heading2, ImagePlus, Italic, Link2, List, ListOrdered, Loader2,
  Newspaper, PenLine, Quote, Rocket, Save, Trash2, Upload, EyeOff,
} from 'lucide-react';
import {
  adminApi, errorMessage, type AdminBlogPost, type BlogPostInput, type BlogTag, type BlogVisibility, type PublishStatus,
} from '@/lib/api';
import { BLOG_TAGS, VISIBILITY_OPTIONS, formatPostDate } from '@/lib/blog';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';
import { PageHeader } from '@/components/PageHeader';
import { FormSection, Field } from '@/components/FormSection';
import { Markdown } from '@/components/Markdown';
import { Spinner } from '@/components/EmptyState';
import { PublishBadge } from '@/pages/admin/AdminBlog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const SUMMARY_MAX = 300;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const STARTER = `## What's new

Describe the change in a sentence or two.

- First improvement
- Second improvement

## How to use it

1. Open **Create Receipt**
2. ...
`;

interface FormState {
  title: string;
  summary: string;
  content: string;
  tag: BlogTag;
  visibility: BlogVisibility;
}

const emptyForm: FormState = { title: '', summary: '', content: STARTER, tag: 'feature', visibility: 'both' };

function validateForm(f: FormState): string | null {
  if (f.title.trim().length < 3) return 'Title must be at least 3 characters.';
  if (f.summary.trim().length < 10) return 'Summary must be at least 10 characters.';
  if (!f.content.trim()) return 'Write some content for the post.';
  return null;
}

export default function BlogEditorPage() {
  const { id } = useParams();
  const postId = id ? Number(id) : null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [post, setPost] = useState<AdminBlogPost | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [saving, setSaving] = useState<PublishStatus | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [dirty, setDirty] = useState(false);

  const { data: loaded, isLoading, isError } = useQuery({
    queryKey: ['admin', 'post', postId],
    queryFn: () => adminApi.getPost(postId!),
    enabled: postId !== null,
    retry: false,
  });

  useEffect(() => {
    if (!loaded) return;
    setPost(loaded);
    setForm({
      title: loaded.title, summary: loaded.summary, content: loaded.content || '', tag: loaded.tag, visibility: loaded.visibility,
    });
    setCoverPreview(loaded.cover_image);
  }, [loaded]);

  // Warn before closing the tab with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // Free the object URL made for a newly picked cover.
  useEffect(() => () => {
    if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
  }, [coverPreview]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  // --- Markdown toolbar --------------------------------------------------------

  const replaceSelection = (make: (selected: string) => { text: string; selectFrom: number; selectTo: number }) => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end, value } = el;
    const { text, selectFrom, selectTo } = make(value.slice(start, end));
    update('content', value.slice(0, start) + text + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + selectFrom, start + selectTo);
    });
  };

  const wrap = (before: string, after: string, placeholder: string) => replaceSelection(sel => {
    const inner = sel || placeholder;
    return { text: before + inner + after, selectFrom: before.length, selectTo: before.length + inner.length };
  });

  const prefixLines = (prefix: (i: number) => string, placeholder: string) => replaceSelection(sel => {
    const lines = (sel || placeholder).split('\n');
    const text = lines.map((l, i) => prefix(i) + l).join('\n');
    return { text, selectFrom: 0, selectTo: text.length };
  });

  const insertAtCursor = (snippet: string) => replaceSelection(() => ({ text: snippet, selectFrom: snippet.length, selectTo: snippet.length }));

  const toolbar = [
    { icon: Heading2, label: 'Heading', run: () => prefixLines(() => '## ', 'Heading') },
    { icon: Bold, label: 'Bold', run: () => wrap('**', '**', 'bold text') },
    { icon: Italic, label: 'Italic', run: () => wrap('_', '_', 'italic text') },
    { icon: Link2, label: 'Link', run: () => wrap('[', '](https://)', 'link text') },
    { icon: List, label: 'Bulleted list', run: () => prefixLines(() => '- ', 'List item') },
    { icon: ListOrdered, label: 'Numbered list', run: () => prefixLines(i => `${i + 1}. `, 'List item') },
    { icon: Quote, label: 'Quote', run: () => prefixLines(() => '> ', 'Quote') },
    { icon: Code, label: 'Code', run: () => wrap('`', '`', 'code') },
  ];

  const tooBig = (file: File) => {
    if (file.size <= MAX_IMAGE_BYTES) return false;
    toast({ title: 'Image too large', description: 'Images must be 5 MB or smaller.', variant: 'destructive' });
    return true;
  };

  const handleInlineImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || tooBig(file)) return;
    setUploadingImage(true);
    try {
      const url = await adminApi.uploadImage(file);
      const alt = file.name.replace(/\.[^.]+$/, '').replace(/[[\]]/g, '');
      insertAtCursor(`\n![${alt}](${url})\n`);
    } catch (err) {
      toast({ title: 'Image upload failed', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || tooBig(file)) return;
    setCover(file);
    setCoverPreview(URL.createObjectURL(file));
    setRemoveCover(false);
    setDirty(true);
  };

  const clearCover = () => {
    setCover(null);
    setCoverPreview(null);
    setRemoveCover(true);
    setDirty(true);
  };

  // --- Save ---------------------------------------------------------------------

  const save = async (status: PublishStatus) => {
    const problem = validateForm(form);
    if (problem) {
      toast({ title: 'Check the post', description: problem, variant: 'destructive' });
      return;
    }
    const input: BlogPostInput = {
      ...form, title: form.title.trim(), summary: form.summary.trim(), status, cover, removeCover,
    };
    setSaving(status);
    try {
      const saved = postId ? await adminApi.updatePost(postId, input) : await adminApi.createPost(input);
      setPost(saved);
      setCover(null);
      setRemoveCover(false);
      setCoverPreview(saved.cover_image);
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['blog'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      const wasLive = post?.status === 'published';
      if (status === 'published' && !wasLive) trackEvent('blog_publish', { tag: saved.tag, visibility: saved.visibility });
      toast({
        title: status === 'draft' ? (wasLive ? 'Post unpublished' : 'Draft saved') : wasLive ? 'Post updated' : 'Post published 🎉',
        description: status === 'published' && !wasLive && saved.visibility !== 'public' ? 'Users will see it in their notifications.' : undefined,
      });
      if (!postId) navigate(`/admin/blog/${saved.id}/edit`, { replace: true });
    } catch (err) {
      toast({ title: 'Could not save the post', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  if (postId !== null && isLoading) return <Spinner />;
  if (postId !== null && isError) {
    return (
      <div className="card-soft p-10 text-center">
        <p className="font-bold text-navy">Post not found</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/admin/blog"><ArrowLeft /> Back to posts</Link></Button>
      </div>
    );
  }

  const isLive = post?.status === 'published';
  const notifiesUsers = form.visibility !== 'public';

  return (
    <div className="space-y-6">
      <PageHeader
        className="animate-fade-in-up"
        icon={PenLine}
        eyebrow="Admin · Blog"
        title={postId ? 'Edit Post' : 'New Post'}
        description={post ? `${isLive ? `Published ${formatPostDate(post.published_at)}` : 'Draft'}${dirty ? ' · unsaved changes' : ''}` : 'Write an update for your users'}
        actions={
          <>
            <Button variant="ghost" asChild><Link to="/admin/blog"><ArrowLeft /> All posts</Link></Button>
            {isLive && <Button variant="outline" asChild><Link to={`/blog/${post!.slug}`}><Eye /> View</Link></Button>}
          </>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="stagger space-y-6">
          <FormSection icon={Newspaper} title="Post details" description="Shown on the blog list and in notifications">
            <div className="space-y-4">
              <Field label="Title" htmlFor="title">
                <Input
                  id="title" value={form.title} onChange={e => update('title', e.target.value)} maxLength={200}
                  placeholder="e.g. Dual receipts now print side by side" className="h-12 text-lg font-semibold"
                />
              </Field>
              <Field label="Summary" htmlFor="summary">
                <Textarea
                  id="summary" rows={2} value={form.summary} onChange={e => update('summary', e.target.value)} maxLength={SUMMARY_MAX}
                  placeholder="One or two sentences. This is the text users see in their notification."
                />
                <p className="text-right text-xs text-muted-foreground">{form.summary.length} / {SUMMARY_MAX}</p>
              </Field>
            </div>
          </FormSection>

          <section className="card-soft overflow-hidden">
            <Tabs defaultValue="write">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
                <TabsList>
                  <TabsTrigger value="write"><PenLine className="mr-1.5 h-4 w-4" /> Write</TabsTrigger>
                  <TabsTrigger value="preview"><Eye className="mr-1.5 h-4 w-4" /> Preview</TabsTrigger>
                </TabsList>
                <span className="text-xs text-muted-foreground">Markdown supported</span>
              </div>
              <TabsContent value="write" className="mt-0">
                <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 px-3 py-2">
                  {toolbar.map(t => (
                    <Button key={t.label} type="button" size="icon" variant="ghost" className="h-9 w-9" onClick={t.run} title={t.label} aria-label={t.label}>
                      <t.icon className="h-4 w-4" />
                    </Button>
                  ))}
                  <span className="mx-1 h-6 w-px bg-border" />
                  <Button type="button" size="sm" variant="ghost" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}>
                    {uploadingImage ? <Loader2 className="animate-spin" /> : <ImagePlus />} {uploadingImage ? 'Uploading…' : 'Image'}
                  </Button>
                  <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleInlineImage} />
                </div>
                <textarea
                  ref={textareaRef}
                  value={form.content}
                  onChange={e => update('content', e.target.value)}
                  className="block min-h-[460px] w-full resize-y bg-card p-5 font-mono text-sm leading-relaxed text-foreground outline-none"
                  placeholder="Write your post…"
                  spellCheck
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-0 min-h-[460px] p-5 sm:p-8">
                {form.content.trim() ? <Markdown>{form.content}</Markdown> : <p className="text-muted-foreground">Nothing to preview yet.</p>}
              </TabsContent>
            </Tabs>
          </section>
        </div>

        <aside className="stagger space-y-6 lg:sticky lg:top-24">
          <section className="card-soft space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-navy">Publish</h2>
              <PublishBadge status={post?.status || 'draft'} />
            </div>
            <Button
              className="w-full" size="lg"
              disabled={saving !== null}
              onClick={() => (isLive ? save('published') : setConfirmPublish(true))}
            >
              {saving === 'published' ? <Loader2 className="animate-spin" /> : <Rocket />}
              {isLive ? 'Update post' : 'Publish'}
            </Button>
            <Button className="w-full" variant="outline" disabled={saving !== null} onClick={() => save('draft')}>
              {saving === 'draft' ? <Loader2 className="animate-spin" /> : isLive ? <EyeOff /> : <Save />}
              {isLive ? 'Unpublish (back to draft)' : 'Save draft'}
            </Button>
          </section>

          <section className="card-soft space-y-3 p-5">
            <h2 className="font-bold text-navy">Who can read it</h2>
            <div className="space-y-2" role="radiogroup" aria-label="Visibility">
              {VISIBILITY_OPTIONS.map(o => {
                const active = form.visibility === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => update('visibility', o.value)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all duration-200',
                      active ? 'border-primary bg-primary/[0.06] ring-2 ring-primary/20' : 'hover:border-primary/40 hover:bg-accent/50',
                    )}
                  >
                    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', active ? 'bg-primary text-primary-foreground' : 'bg-accent text-primary')}>
                      <o.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-navy">{o.label}</span>
                      <span className="block text-xs text-muted-foreground">{o.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card-soft space-y-3 p-5">
            <h2 className="font-bold text-navy">Tag</h2>
            <div className="flex flex-wrap gap-2">
              {BLOG_TAGS.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => update('tag', t.value)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                    form.tag === t.value ? cn(t.className, 'ring-2 ring-current/30 ring-offset-1 ring-offset-card') : 'bg-muted text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          <section className="card-soft space-y-3 p-5">
            <h2 className="font-bold text-navy">Cover image</h2>
            {coverPreview ? (
              <div className="relative overflow-hidden rounded-xl border">
                <img src={coverPreview} alt="Cover preview" className="aspect-[16/9] w-full object-cover" />
                <Button size="icon" variant="secondary" className="absolute right-2 top-2 h-8 w-8" onClick={clearCover} aria-label="Remove cover">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Optional. Shown at the top of the post and on its card. 16:9 works best.</p>
            )}
            <Button variant="outline" className="w-full" asChild>
              <label className="cursor-pointer">
                <Upload /> {coverPreview ? 'Replace cover' : 'Upload cover'}
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleCover} />
              </label>
            </Button>
          </section>
        </aside>
      </div>

      <AlertDialog open={confirmPublish} onOpenChange={setConfirmPublish}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish this post?</AlertDialogTitle>
            <AlertDialogDescription>
              {form.visibility === 'public' && 'It will appear on the public blog. Logged-in users won\'t be notified.'}
              {form.visibility === 'users' && 'It will appear in the in-app blog and every user will get a notification.'}
              {form.visibility === 'both' && 'It will appear on the public blog and in the app, and every user will get a notification.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => save('published')}>
              <Rocket className="mr-2 h-4 w-4" /> {notifiesUsers ? 'Publish & notify' : 'Publish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
