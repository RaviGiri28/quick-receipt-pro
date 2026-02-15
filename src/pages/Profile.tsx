import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Save, Upload } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [businessName, setBusinessName] = useState(user?.business?.name || '');
  const [businessAddress, setBusinessAddress] = useState(user?.business?.address || '');
  const [businessPhone, setBusinessPhone] = useState(user?.business?.phone || '');

  if (!user) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        updateProfile({ business: { ...user.business, logo: ev.target?.result as string } });
        toast({ title: 'Logo updated' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateProfile({
      name,
      phone,
      business: { ...user.business, name: businessName, address: businessAddress, phone: businessPhone },
    });
    toast({ title: 'Profile updated' });
  };

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl">
      <h1 className="text-2xl font-bold">Profile</h1>

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
          <div><Label>Business Address</Label><Input value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} placeholder="Shop No. 5, Main Road, Mumbai" /></div>
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
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="gap-2">
        <Save className="h-4 w-4" /> Save Profile
      </Button>
    </div>
  );
}
