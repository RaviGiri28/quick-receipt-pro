import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSettings, saveSettings } from '@/lib/storage';
import { AppSettings, CustomFieldDef } from '@/types/receipt';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { errorMessage } from '@/lib/api';
import { Save, Plus, Trash2 } from 'lucide-react';

const MAX_CUSTOM_FIELDS = 20;

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, updateCustomFields } = useAuth();
  // Display preferences are per device; custom fields belong to the account.
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>(user?.customFields || []);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    saveSettings(settings);
    const fields = customFields
      .map(cf => ({ ...cf, label: cf.label.trim() }))
      .filter(cf => cf.label);
    setSaving(true);
    try {
      await updateCustomFields(fields);
      setCustomFields(fields);
      toast({ title: 'Settings saved', description: 'Your preferences have been updated.' });
    } catch (err) {
      toast({ title: 'Could not save custom fields', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const addCustomField = () => {
    const newField: CustomFieldDef = {
      id: `cf_${Date.now()}`,
      label: '',
    };
    setCustomFields(prev => [...prev, newField]);
  };

  const updateCustomField = (id: string, label: string) => {
    setCustomFields(prev => prev.map(cf => (cf.id === id ? { ...cf, label } : cf)));
  };

  const removeCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(cf => cf.id !== id));
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
            <Button size="sm" variant="outline" onClick={addCustomField} className="gap-1" disabled={customFields.length >= MAX_CUSTOM_FIELDS}>
              <Plus className="h-3 w-3" /> Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {customFields.length === 0 && (
            <p className="text-sm text-muted-foreground">No custom fields added yet. Custom fields will appear on your receipts.</p>
          )}
          {customFields.map(cf => (
            <div key={cf.id} className="flex items-center gap-2">
              <Input
                value={cf.label}
                onChange={e => updateCustomField(cf.id, e.target.value)}
                placeholder="Field label (e.g. Branch Name)"
                maxLength={100}
                className="flex-1"
              />
              <Button size="sm" variant="ghost" onClick={() => removeCustomField(cf.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="gap-2" disabled={saving}>
        <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Settings'}
      </Button>
    </div>
  );
}
