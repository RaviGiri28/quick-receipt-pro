import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSettings, saveSettings } from '@/lib/storage';
import { AppSettings, CustomFieldDef } from '@/types/receipt';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Save, Plus, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, updateProfile } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(getSettings());

  const handleSave = () => {
    saveSettings(settings);
    // Also sync toggle settings to user's business profile
    if (user) {
      updateProfile({
        business: {
          ...user.business,
          showLogo: settings.showLogo,
          showName: settings.showName,
          showWatermark: settings.showWatermark,
          primaryColor: settings.primaryColor,
        },
      });
    }
    toast({ title: 'Settings saved', description: 'Your preferences have been updated.' });
  };

  const addCustomField = () => {
    const newField: CustomFieldDef = {
      id: `cf_${Date.now()}`,
      label: '',
    };
    setSettings(prev => ({
      ...prev,
      customFields: [...(prev.customFields || []), newField],
    }));
  };

  const updateCustomField = (id: string, label: string) => {
    setSettings(prev => ({
      ...prev,
      customFields: (prev.customFields || []).map(cf =>
        cf.id === id ? { ...cf, label } : cf
      ),
    }));
  };

  const removeCustomField = (id: string) => {
    setSettings(prev => ({
      ...prev,
      customFields: (prev.customFields || []).filter(cf => cf.id !== id),
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Receipt Display</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label>Show business logo on receipt</Label>
            <Switch
              checked={settings.showLogo}
              onCheckedChange={v => setSettings(prev => ({ ...prev, showLogo: v }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Show business name on receipt</Label>
            <Switch
              checked={settings.showName}
              onCheckedChange={v => setSettings(prev => ({ ...prev, showName: v }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Print dual receipts by default</Label>
            <Switch
              checked={settings.dualReceipt}
              onCheckedChange={v => setSettings(prev => ({ ...prev, dualReceipt: v }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Receipt Color Theme (HSL)</Label>
            <Input
              value={settings.primaryColor}
              onChange={e => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
              placeholder="217 91% 30%"
            />
            <p className="text-xs text-muted-foreground mt-1">Format: hue saturation% lightness%</p>
          </div>
          <div>
            <Label>Preview</Label>
            <div className="flex gap-3 mt-2">
              <div className="h-10 w-10 rounded-lg border" style={{ backgroundColor: `hsl(${settings.primaryColor})` }} />
              <div className="h-10 w-10 rounded-lg border" style={{ backgroundColor: `hsl(${settings.primaryColor} / 0.2)` }} />
              <div className="h-10 w-10 rounded-lg border" style={{ backgroundColor: `hsl(${settings.primaryColor} / 0.1)` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Custom Receipt Fields</CardTitle>
            <Button size="sm" variant="outline" onClick={addCustomField} className="gap-1">
              <Plus className="h-3 w-3" /> Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {(!settings.customFields || settings.customFields.length === 0) && (
            <p className="text-sm text-muted-foreground">No custom fields added yet. Custom fields will appear on your receipts.</p>
          )}
          {(settings.customFields || []).map(cf => (
            <div key={cf.id} className="flex items-center gap-2">
              <Input
                value={cf.label}
                onChange={e => updateCustomField(cf.id, e.target.value)}
                placeholder="Field label (e.g. Branch Name)"
                className="flex-1"
              />
              <Button size="sm" variant="ghost" onClick={() => removeCustomField(cf.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="gap-2">
        <Save className="h-4 w-4" /> Save Settings
      </Button>
    </div>
  );
}
