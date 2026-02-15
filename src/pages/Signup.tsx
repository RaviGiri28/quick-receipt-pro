import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SignupPage() {
  const navigate = useNavigate();
  const { user, signup } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '', email: '', password: '', businessName: '', phone: '',
    businessAddress: '', businessPhone: '',
  });

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessAddress.trim()) {
      toast({ title: 'Required', description: 'Business Address is required.', variant: 'destructive' });
      return;
    }
    if (!form.businessPhone.trim()) {
      toast({ title: 'Required', description: 'Business Phone Number is required.', variant: 'destructive' });
      return;
    }
    if (signup(form)) {
      toast({ title: 'Account created', description: 'Welcome to Quick Receipt!' });
      navigate('/');
    } else {
      toast({ title: 'Signup failed', description: 'Email already exists.', variant: 'destructive' });
    }
  };

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-fade-in-up">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center">
              <Receipt className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Get started with Quick Receipt</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Full Name *</Label><Input value={form.name} onChange={e => update('name', e.target.value)} required /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => update('email', e.target.value)} required /></div>
            <div><Label>Password *</Label><Input type="password" value={form.password} onChange={e => update('password', e.target.value)} required /></div>
            <div><Label>Business Name</Label><Input value={form.businessName} onChange={e => update('businessName', e.target.value)} placeholder="Your shop name" /></div>
            <div><Label>Business Address *</Label><Input value={form.businessAddress} onChange={e => update('businessAddress', e.target.value)} placeholder="Shop No. 5, Main Road, Mumbai" required /></div>
            <div><Label>Business Phone Number *</Label><Input value={form.businessPhone} onChange={e => update('businessPhone', e.target.value)} placeholder="+91 98765 43210" required /></div>
            <div><Label>Personal Phone</Label><Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+91 98765 43210" /></div>
            <Button type="submit" className="w-full">Create Account</Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
