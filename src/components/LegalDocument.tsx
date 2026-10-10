import { useEffect } from 'react';
import { FileText } from 'lucide-react';
import { LEGAL_EFFECTIVE_DATE } from '@/lib/legal';

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

// Layout for the Privacy Policy and Terms: title, summary, contents, numbered sections.
export function LegalDocument({ title, intro, summary, sections }: {
  title: string;
  intro: React.ReactNode;
  summary?: React.ReactNode;
  sections: LegalSection[];
}) {
  useEffect(() => {
    document.title = `${title} | Quick Receipt`;
    return () => { document.title = 'Quick Receipt'; };
  }, [title]);

  return (
    <article className="mx-auto max-w-3xl animate-fade-in-up">
      <header className="mb-8 border-b border-border/60 pb-6">
        <span className="chip w-fit text-primary"><FileText className="h-4 w-4" /> Legal</span>
        <h1 className="mt-4 text-3xl font-extrabold text-navy sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {LEGAL_EFFECTIVE_DATE}</p>
        <div className="mt-4 space-y-3 leading-relaxed text-foreground/90">{intro}</div>
      </header>

      {summary && (
        <section aria-label="Summary" className="mb-8 rounded-2xl border border-primary/20 bg-accent/50 p-5">
          <h2 className="mb-2 font-bold text-navy">In short</h2>
          <div className="space-y-2 text-sm leading-relaxed text-foreground/90">{summary}</div>
        </section>
      )}

      <nav aria-label="Contents" className="mb-10 rounded-2xl border border-border/60 bg-card p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Contents</h2>
        <ol className="grid list-decimal gap-1.5 pl-5 text-sm sm:grid-cols-2">
          {sections.map(s => (
            <li key={s.id}><a href={`#${s.id}`} className="text-primary hover:underline">{s.title}</a></li>
          ))}
        </ol>
      </nav>

      <div className="space-y-10">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="mb-3 text-xl font-bold text-navy">{i + 1}. {s.title}</h2>
            <div className="legal-body space-y-3 leading-relaxed text-foreground/90 [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_a]:font-medium [&_a]:text-primary [&_a:hover]:underline [&_strong]:text-navy">
              {s.body}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
