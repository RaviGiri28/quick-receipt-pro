import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Receipt, Eye, EyeOff, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorMessage } from '@/lib/api';

export default function SignupPage() {
  const navigate = useNavigate();
  const { user, signup } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    businessName: '', phone: '', businessAddress: '', businessPhone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      setLogoPreview(URL.createObjectURL(file));
      setLogoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessAddress.trim()) {
      toast({ title: 'Required', description: 'Business Address is required.', variant: 'destructive' });
      return;
    }
    if (!form.businessPhone.trim()) {
      toast({ title: 'Required', description: 'Business Phone Number is required.', variant: 'destructive' });
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast({ title: 'Password mismatch', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: 'Weak password', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await signup({ ...form, logo: logoFile });
      toast({ title: '✅ Account created successfully', description: 'Please login to enter Quick Receipt.' });
      navigate('/login');
    } catch (err) {
      toast({ title: 'Signup failed', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setSubmitting(false);
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
            <div>
              <Label>Password *</Label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} required />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>Confirm Password *</Label>
              <div className="relative">
                <Input type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} required />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-destructive mt-1">Passwords do not match</p>
              )}
            </div>
            <div><Label>Business Name *</Label><Input value={form.businessName} onChange={e => update('businessName', e.target.value)} placeholder="Your shop name" required /></div>
            <div><Label>Business Address *</Label><Input value={form.businessAddress} onChange={e => update('businessAddress', e.target.value)} placeholder="Shop No. 5, Main Road, Mumbai" maxLength={500} required /></div>
            <div><Label>Business Phone Number *</Label><Input value={form.businessPhone} onChange={e => update('businessPhone', e.target.value)} placeholder="+91 98765 43210" required /></div>
            <div><Label>Personal Phone *</Label><Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+91 98765 43210" required /></div>
            <div>
              <Label>Business Logo</Label>
              <div className="flex items-center gap-4 mt-2">
                {logoPreview && (
                  <img src={logoPreview} alt="Logo preview" className="h-14 w-14 rounded-full object-cover border" />
                )}
                <Button type="button" variant="outline" className="gap-2" asChild>
                  <label className="cursor-pointer">
                    <Upload className="h-4 w-4" /> Upload Logo
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create Account'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
