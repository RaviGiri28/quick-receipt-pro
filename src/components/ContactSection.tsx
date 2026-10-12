import { useState } from 'react';
import { CheckCircle2, Clock, Mail, MessageSquare, Phone, Send, Tag, User, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/FormSection';
import { IconInput } from '@/components/IconInput';
import { useToast } from '@/hooks/use-toast';
import { supportApi, errorMessage } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import { SUPPORT_EMAIL } from '@/lib/config';

const MIN_MESSAGE_LENGTH = 10;
const emptyForm = { name: '', email: '', phone: '', subject: '', message: '', website: '' };

const contactInfo = [
  {
    icon: Mail,
    title: 'Email us',
    body: <a href={`mailto:${SUPPORT_EMAIL}`} className="break-all hover:text-primary hover:underline">{SUPPORT_EMAIL}</a>,
  },
  { icon: Clock, title: 'Working hours', body: 'Mon–Fri, 9:00 A.M – 6:00 P.M' },
  { icon: Zap, title: 'Quick replies', body: 'We usually reply within one working day.' },
];

// Contact form on the public landing page; messages go to the support inbox.
export function ContactSection() {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (key: keyof typeof emptyForm, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.message.trim().length < MIN_MESSAGE_LENGTH) {
      toast({ title: 'Message too short', description: 'Please tell us a little more.', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      await supportApi.contact(form);
      trackEvent('contact_message_sent');
      setSent(true);
      setForm(emptyForm);
    } catch (err) {
      toast({ title: 'Could not send message', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
      <div className="reveal space-y-4">
        {contactInfo.map(c => (
          <div key={c.title} className="card-soft card-hover group flex items-center gap-4 p-5">
            <div className="icon-tile icon-tile-pop h-12 w-12 shrink-0 rounded-full"><c.icon className="h-5 w-5" /></div>
            <div className="min-w-0">
              <h3 className="font-bold text-navy">{c.title}</h3>
              <div className="text-sm text-muted-foreground">{c.body}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="reveal card-soft p-5 sm:p-7" style={{ transitionDelay: '80ms' }}>
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center animate-fade-in-up">
            <div className="icon-tile h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="h-8 w-8" /></div>
            <h3 className="text-xl font-bold text-navy">Thank you! Your message is on its way.</h3>
            <p className="max-w-sm text-muted-foreground">We will reply to your email within one working day.</p>
            <Button variant="outline" onClick={() => setSent(false)} className="mt-2">Send another message</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name *" htmlFor="contact-name">
                <IconInput id="contact-name" icon={User} value={form.name} onChange={e => update('name', e.target.value)} placeholder="Your name" autoComplete="name" minLength={2} maxLength={100} required />
              </Field>
              <Field label="Email *" htmlFor="contact-email">
                <IconInput id="contact-email" icon={Mail} type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" autoComplete="email" maxLength={100} required />
              </Field>
              <Field label="Phone (optional)" htmlFor="contact-phone">
                <IconInput id="contact-phone" icon={Phone} type="tel" inputMode="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+91 9876543210" autoComplete="tel" maxLength={20} />
              </Field>
              <Field label="Subject *" htmlFor="contact-subject">
                <IconInput id="contact-subject" icon={Tag} value={form.subject} onChange={e => update('subject', e.target.value)} placeholder="How can we help?" minLength={3} maxLength={150} required />
              </Field>
            </div>
            <Field label="Message *" htmlFor="contact-message">
              <Textarea
                id="contact-message" rows={5} value={form.message} onChange={e => update('message', e.target.value)}
                placeholder="Tell us about your question or your business..." maxLength={5000} required
              />
              <p className="text-right text-xs text-muted-foreground">{form.message.length} / 5000</p>
            </Field>
            {/* Honeypot: hidden from people, filled in by spam bots. */}
            <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
              <label htmlFor="contact-website">Website</label>
              <input id="contact-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={e => update('website', e.target.value)} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" /> We only use your details to reply to you.
              </p>
              <Button type="submit" size="lg" disabled={sending} className="group">
                <Send className="transition-transform group-hover:translate-x-0.5" /> {sending ? 'Sending…' : 'Send Message'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
