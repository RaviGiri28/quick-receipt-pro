import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSettings, saveSettings } from '@/lib/storage';
import { AppSettings } from '@/types/receipt';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const toggleSettings: { key: keyof AppSettings; label: string }[] = [
  { key: 'showLogo', label: 'Show business logo on receipt' },
  { key: 'showName', label: 'Show business name on receipt' },
  { key: 'showWatermark', label: 'Show "Quick Receipt" watermark' },
  { key: 'dualReceipt', label: 'Print dual receipts by default' },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings>(getSettings());

  const handleSave = () => {
    saveSettings(settings);
    toast({ title: 'Settings saved', description: 'Your preferences have been updated.' });
  };

  const toggle = (key: keyof AppSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] } as AppSettings));
  };

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Receipt Display</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {toggleSettings.map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <Label>{item.label}</Label>
              <Switch checked={!!settings[item.key]} onCheckedChange={() => toggle(item.key)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Primary Color (HSL)</Label>
            <Input
              value={settings.primaryColor}
              onChange={e => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
              placeholder="217 91% 30%"
            />
            <p className="text-xs text-muted-foreground mt-1">Format: hue saturation% lightness%</p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="gap-2">
        <Save className="h-4 w-4" /> Save Settings
      </Button>
    </div>
  );
}
