import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IconInput } from '@/components/IconInput';
import { PrinterHero } from '@/components/PrinterHero';
import { PublicNav } from '@/components/PublicNav';
import { LogoMark } from '@/components/brand/Logo';
import { AuthBackground, HandNote } from '@/components/AuthDecor';
import { useAuth } from '@/contexts/AuthContext';
import {
  Eye, EyeOff, Upload, User, Mail, Lock, Store, MapPin, Phone, Smartphone, UserPlus, Rocket, Zap, ShieldCheck, Printer,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorMessage } from '@/lib/api';

const perks = [
  { icon: Zap, title: 'Fast & Easy Setup', desc: 'Get started in just a few minutes.' },
  { icon: ShieldCheck, title: 'Secure & Reliable', desc: 'Your data is always safe with us.' },
  { icon: Printer, title: 'Print Ready', desc: 'High-quality thermal print support.' },
];

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="font-semibold text-navy">{label}</Label>
      {children}
    </div>
  );
}

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

  const eyeToggle = (shown: boolean, toggle: () => void) => (
    <button type="button" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-primary" onClick={toggle} aria-label={shown ? 'Hide password' : 'Show password'}>
      {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas">
      <AuthBackground />
      <PublicNav />

      <div className="relative mx-auto grid max-w-7xl items-start gap-10 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[1fr_minmax(0,560px)]">
        {/* Brand side */}
        <div className="hidden lg:block lg:pt-8">
          <div className="stagger space-y-5">
            <span className="chip w-fit text-primary"><Rocket className="h-4 w-4" /> Join Thousands of Happy Businesses</span>
            <h1 className="text-4xl font-extrabold leading-[1.1] text-navy xl:text-5xl">
              Create Your Account
              <span className="block text-gradient">and Start Generating Receipts Today!</span>
            </h1>
            <p className="max-w-lg text-muted-foreground xl:text-lg">
              Manage your receipts, track transactions, and keep your business organized — all in one place.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-center gap-2">
            <div className="stagger space-y-5">
              {perks.map(p => (
                <div key={p.title} className="group flex items-start gap-3">
                  <span className="icon-tile icon-tile-pop h-11 w-11 rounded-full"><p.icon className="h-5 w-5" /></span>
                  <div>
                    <p className="font-semibold text-navy">{p.title}</p>
                    <p className="text-sm text-muted-foreground">{p.desc}</p>
                  </div>
                </div>
              ))}
              <div className="pt-6"><HandNote lines={['Simple Steps.', 'Big Convenience.']} /></div>
            </div>
            <div className="animate-fade-in-up [animation-delay:0.25s]">
              <PrinterHero />
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="card-soft w-full animate-fade-in-up rounded-3xl p-6 shadow-[0_30px_80px_-30px_hsl(var(--shadow-color)/0.35)] sm:p-9">
          <div className="text-center">
            <LogoMark className="mx-auto h-16 w-16 animate-float" />
            <h2 className="mt-4 text-2xl font-extrabold text-navy sm:text-3xl">Create Account</h2>
            <p className="mt-1 text-sm text-muted-foreground">Get started with Quick Receipt</p>
          </div>
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <Field label="Full Name *" htmlFor="name">
              <IconInput id="name" icon={User} autoComplete="name" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Enter your full name" required />
            </Field>
            <Field label="Email *" htmlFor="email">
              <IconInput id="email" icon={Mail} type="email" autoComplete="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Password *" htmlFor="password">
                <IconInput id="password" icon={Lock} type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="Create password" required trailing={eyeToggle(showPassword, () => setShowPassword(!showPassword))} />
              </Field>
              <Field label="Confirm Password *" htmlFor="confirmPassword">
                <IconInput id="confirmPassword" icon={Lock} type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} placeholder="Re-enter password" required trailing={eyeToggle(showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword))} />
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="animate-fade-in-up text-xs text-destructive">Passwords do not match</p>
                )}
              </Field>
            </div>
            <Field label="Business Name *" htmlFor="businessName">
              <IconInput id="businessName" icon={Store} value={form.businessName} onChange={e => update('businessName', e.target.value)} placeholder="Your shop or business name" required />
            </Field>
            <Field label="Business Address *" htmlFor="businessAddress">
              <IconInput id="businessAddress" icon={MapPin} value={form.businessAddress} onChange={e => update('businessAddress', e.target.value)} placeholder="Shop No. 5, Main Road, Mumbai" maxLength={500} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business Phone Number *" htmlFor="businessPhone">
                <IconInput id="businessPhone" icon={Phone} type="tel" value={form.businessPhone} onChange={e => update('businessPhone', e.target.value)} placeholder="+91 98765 43210" required />
              </Field>
              <Field label="Personal Phone *" htmlFor="phone">
                <IconInput id="phone" icon={Smartphone} type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+91 98765 43210" required />
              </Field>
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-navy">Business Logo</Label>
              <label className="group flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-input p-3 transition-colors hover:border-primary/50 hover:bg-accent/50">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="h-12 w-12 rounded-full border object-cover" />
                ) : (
                  <span className="icon-tile icon-tile-pop h-12 w-12 rounded-full"><Upload className="h-5 w-5" /></span>
                )}
                <span className="text-sm">
                  <span className="font-semibold text-primary">{logoPreview ? 'Change logo' : 'Upload logo'}</span>
                  <span className="block text-muted-foreground">PNG, JPG or WEBP (optional)</span>
                </span>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
            <Button type="submit" className="h-12 w-full text-base" disabled={submitting}>
              {submitting ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Creating account…</>
              ) : (
                <><UserPlus /> Create Account</>
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
