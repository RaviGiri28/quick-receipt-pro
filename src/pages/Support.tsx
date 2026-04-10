import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Send, Mail, MessageSquare, Clock } from 'lucide-react';

export default function SupportPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'Message sent', description: "We'll get back to you soon!" });
    setForm({ name: '', email: '', subject: '', message: '' });
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
              <div><Label>Name</Label><Input value={form.name} onChange={e => update('name', e.target.value)} required /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => update('email', e.target.value)} required /></div>
            </div>
            <div><Label>Subject</Label><Input value={form.subject} onChange={e => update('subject', e.target.value)} required /></div>
            <div><Label>Message</Label><Textarea rows={5} value={form.message} onChange={e => update('message', e.target.value)} required /></div>
            <Button type="submit" className="gap-2"><Send className="h-4 w-4" /> Send Message</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <Mail className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-medium">Email Support</h3>
              <p className="text-sm text-muted-foreground">support@quickreceipt.in</p>
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
