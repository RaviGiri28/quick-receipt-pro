import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { authApi, errorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { FormSection, Field } from '@/components/FormSection';
import { IconInput } from '@/components/IconInput';
import { LogoMark } from '@/components/brand/Logo';
import { AccountDataSection } from '@/components/AccountDataSection';
import {
  KeyRound, Save, Upload, User, UserCircle, Mail, Phone, Store, MapPin, Building2, Lock, Eye, EyeOff, ShieldCheck,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [businessName, setBusinessName] = useState(user?.business?.name || '');
  const [businessAddress, setBusinessAddress] = useState(user?.business?.address || '');
  const [businessPhone, setBusinessPhone] = useState(user?.business?.phone || '');
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  if (!user) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      toast({ title: 'Password mismatch', description: 'New passwords do not match.', variant: 'destructive' });
      return;
    }
    if (passwords.next.length < 6) {
      toast({ title: 'Weak password', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    setChangingPassword(true);
    try {
      await authApi.changePassword(passwords.current, passwords.next, passwords.confirm);
      setPasswords({ current: '', next: '', confirm: '' });
      toast({ title: 'Password changed', description: 'You have been signed out on all other devices.' });
    } catch (err) {
      toast({ title: 'Could not change password', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      await updateProfile({ logo: file });
      toast({ title: 'Logo updated' });
    } catch (err) {
      toast({ title: 'Logo upload failed', description: errorMessage(err), variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, phone, businessName, businessAddress, businessPhone });
      toast({ title: 'Profile updated' });
    } catch (err) {
      toast({ title: 'Update failed', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const passwordType = showPasswords ? 'text' : 'password';
  const passwordToggle = (
    <button
      type="button"
      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
      onClick={() => setShowPasswords(!showPasswords)}
      aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
    >
      {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        className="animate-fade-in-up"
        icon={UserCircle}
        title="Profile"
        description="Manage your account and the business details printed on receipts"
        actions={
          <Button onClick={handleSave} disabled={saving} className="px-6">
            <Save /> {saving ? 'Saving…' : 'Save Profile'}
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div className="stagger space-y-6">
          <FormSection icon={User} title="Personal Information" description="Your name and contact details">
            <div className="space-y-4">
              <Field label="Name" htmlFor="name">
                <IconInput id="name" icon={User} value={name} onChange={e => setName(e.target.value)} />
              </Field>
              <Field label="Email" htmlFor="email">
                <IconInput id="email" icon={Mail} value={user.email} disabled className="bg-muted" />
              </Field>
              <Field label="Phone" htmlFor="phone">
                <IconInput id="phone" icon={Phone} value={phone} onChange={e => setPhone(e.target.value)} />
              </Field>
            </div>
          </FormSection>

          <FormSection icon={KeyRound} title="Change Password" description="You'll be signed out on all other devices">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Field label="Current Password" htmlFor="currentPassword">
                <IconInput
                  id="currentPassword" icon={Lock} type={passwordType} autoComplete="current-password" required
                  value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                  trailing={passwordToggle}
                />
              </Field>
              <Field label="New Password" htmlFor="newPassword">
                <IconInput
                  id="newPassword" icon={Lock} type={passwordType} autoComplete="new-password" required
                  value={passwords.next} onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))}
                />
              </Field>
              <Field
                label="Confirm New Password"
                htmlFor="confirmPassword"
                error={passwords.confirm && passwords.next !== passwords.confirm ? 'Passwords do not match' : undefined}
              >
                <IconInput
                  id="confirmPassword" icon={ShieldCheck} type={passwordType} autoComplete="new-password" required
                  value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                />
              </Field>
              <Button type="submit" variant="secondary" disabled={changingPassword}>
                <KeyRound /> {changingPassword ? 'Changing…' : 'Change Password'}
              </Button>
            </form>
          </FormSection>

          <AccountDataSection />
        </div>

        <div className="stagger space-y-6">
          <FormSection icon={Store} title="Business Details" description="Shown in the header of every receipt">
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-xl border border-dashed p-4">
                {user.business.logo ? (
                  <img src={user.business.logo} alt="Business logo" className="h-16 w-16 rounded-2xl border object-cover shadow-sm" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
                    <LogoMark className="h-9 w-9 opacity-60" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy">Business Logo</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG or WebP</p>
                </div>
                <Button variant="outline" asChild>
                  <label className="cursor-pointer">
                    <Upload /> {user.business.logo ? 'Replace' : 'Upload'}
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </Button>
              </div>
              <Field label="Business Name" htmlFor="businessName">
                <IconInput id="businessName" icon={Building2} value={businessName} onChange={e => setBusinessName(e.target.value)} />
              </Field>
              <Field label="Business Address" htmlFor="businessAddress">
                <IconInput
                  id="businessAddress" icon={MapPin} value={businessAddress} onChange={e => setBusinessAddress(e.target.value)}
                  placeholder="Shop No. 5, Main Road, Mumbai" maxLength={500}
                />
              </Field>
              <Field label="Business Phone Number" htmlFor="businessPhone">
                <IconInput
                  id="businessPhone" icon={Phone} value={businessPhone} onChange={e => setBusinessPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </Field>
            </div>
          </FormSection>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg">
              <Save /> {saving ? 'Saving…' : 'Save Profile'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
