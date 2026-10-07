import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supportApi, errorMessage } from '@/lib/api';
import { SUPPORT_EMAIL } from '@/lib/config';
import { Send, Mail, MessageSquare, Clock } from 'lucide-react';

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
      toast({ title: 'Message sent', description: `Ticket #${ticketId} created. We'll reply to ${form.email.trim()} soon.` });
      setForm(prev => ({ ...prev, subject: '', message: '' }));
    } catch (err) {
      toast({ title: 'Could not send message', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Support</h1>
        <p className="text-muted-foreground">Have a question or issue? We're here to help.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" /> Contact Us
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => update('name', e.target.value)} maxLength={100} required /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => update('email', e.target.value)} maxLength={100} required /></div>
            </div>
            <div><Label>Subject</Label><Input value={form.subject} onChange={e => update('subject', e.target.value)} minLength={3} maxLength={150} required /></div>
            <div><Label>Message</Label><Textarea rows={5} value={form.message} onChange={e => update('message', e.target.value)} placeholder="Describe your problem..." maxLength={5000} required /></div>
            <Button type="submit" className="gap-2" disabled={sending}>
              <Send className="h-4 w-4" /> {sending ? 'Sending…' : 'Send Message'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <Mail className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-medium">Email Support</h3>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm text-muted-foreground hover:underline">{SUPPORT_EMAIL}</a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <Clock className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-medium">Working Hours</h3>
              <p className="text-sm text-muted-foreground">Mon–Fri, 9:00 A.M – 6:00 P.M</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
