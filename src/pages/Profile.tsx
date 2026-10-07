import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Save, Upload } from 'lucide-react';
import { authApi, errorMessage } from '@/lib/api';

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

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-center">Profile</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div><Label>Email</Label><Input value={user.email} disabled className="bg-muted" /></div>
          <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Business Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Business Name</Label><Input value={businessName} onChange={e => setBusinessName(e.target.value)} /></div>
          <div><Label>Business Address</Label><Input value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} placeholder="Shop No. 5, Main Road, Mumbai" maxLength={500} /></div>
          <div><Label>Business Phone Number</Label><Input value={businessPhone} onChange={e => setBusinessPhone(e.target.value)} placeholder="+91 98765 43210" /></div>
          <div>
            <Label>Business Logo</Label>
            <div className="flex items-center gap-4 mt-2">
              {user.business.logo && (
                <img src={user.business.logo} alt="Logo" className="h-16 w-16 rounded-full object-cover border" />
              )}
              <Button variant="outline" className="gap-2" asChild>
                <label className="cursor-pointer">
                  <Upload className="h-4 w-4" /> Upload Logo
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoUpload} />
                </label>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={handleSave} className="gap-2" disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Profile'}
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label>Current Password</Label>
              <Input type="password" autoComplete="current-password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} required />
            </div>
            <div>
              <Label>New Password</Label>
              <Input type="password" autoComplete="new-password" value={passwords.next} onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))} required />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input type="password" autoComplete="new-password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} required />
              {passwords.confirm && passwords.next !== passwords.confirm && (
                <p className="text-xs text-destructive mt-1">Passwords do not match</p>
              )}
            </div>
            <Button type="submit" variant="secondary" className="gap-2" disabled={changingPassword}>
              <KeyRound className="h-4 w-4" /> {changingPassword ? 'Changing…' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
