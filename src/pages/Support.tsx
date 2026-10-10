import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';
import { useAuth } from '@/contexts/AuthContext';
import { supportApi, errorMessage } from '@/lib/api';
import { SUPPORT_EMAIL } from '@/lib/config';
import { PageHeader } from '@/components/PageHeader';
import { FormSection, Field } from '@/components/FormSection';
import { IconInput } from '@/components/IconInput';
import { Send, Mail, MessageSquare, Clock, LifeBuoy, User, Tag } from 'lucide-react';

const MIN_MESSAGE_LENGTH = 10;

export default function SupportPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  // Prefilled from the account; the email can be changed to where replies should go.
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.message.trim().length < MIN_MESSAGE_LENGTH) {
      toast({ title: 'Message too short', description: 'Please describe your problem in a little more detail.', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const { ticketId } = await supportApi.send(form);
      trackEvent('support_message_sent');
      toast({ title: 'Message sent', description: `Ticket #${ticketId} created. We'll reply to ${form.email.trim()} soon.` });
      setForm(prev => ({ ...prev, subject: '', message: '' }));
    } catch (err) {
      toast({ title: 'Could not send message', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const contactCards = [
    {
      icon: Mail,
      title: 'Email Support',
      body: <a href={`mailto:${SUPPORT_EMAIL}`} className="break-all text-sm text-muted-foreground hover:text-primary hover:underline">{SUPPORT_EMAIL}</a>,
    },
    {
      icon: Clock,
      title: 'Working Hours',
      body: <p className="text-sm text-muted-foreground">Mon–Fri, 9:00 A.M – 6:00 P.M</p>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        className="animate-fade-in-up"
        icon={LifeBuoy}
        title="Support"
        description="Have a question or issue? We're here to help."
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <FormSection icon={MessageSquare} title="Contact Us" description="We usually reply within one working day" className="animate-fade-in-up">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="name">
                <IconInput id="name" icon={User} value={form.name} onChange={e => update('name', e.target.value)} maxLength={100} required />
              </Field>
              <Field label="Email" htmlFor="email">
                <IconInput id="email" icon={Mail} type="email" value={form.email} onChange={e => update('email', e.target.value)} maxLength={100} required />
              </Field>
            </div>
            <Field label="Subject" htmlFor="subject">
              <IconInput id="subject" icon={Tag} value={form.subject} onChange={e => update('subject', e.target.value)} minLength={3} maxLength={150} required />
            </Field>
            <Field label="Message" htmlFor="message">
              <Textarea
                id="message" rows={6} value={form.message} onChange={e => update('message', e.target.value)}
                placeholder="Describe your problem..." maxLength={5000} required
              />
              <p className="text-right text-xs text-muted-foreground">{form.message.length} / 5000</p>
            </Field>
            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={sending}>
                <Send /> {sending ? 'Sending…' : 'Send Message'}
              </Button>
            </div>
          </form>
        </FormSection>

        <div className="stagger space-y-4">
          {contactCards.map(c => (
            <div key={c.title} className="group card-soft card-hover flex items-center gap-4 p-5">
              <div className="icon-tile icon-tile-pop h-12 w-12"><c.icon className="h-6 w-6" /></div>
              <div className="min-w-0">
                <h3 className="font-bold text-navy">{c.title}</h3>
                {c.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
