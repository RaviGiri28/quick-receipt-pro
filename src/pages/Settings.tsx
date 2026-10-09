import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSettings, saveSettings } from '@/lib/storage';
import { AppSettings, CustomFieldDef, ReceiptData } from '@/types/receipt';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { errorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { FormSection } from '@/components/FormSection';
import { IconInput } from '@/components/IconInput';
import { LivePreviewPanel } from '@/components/LivePreviewPanel';
import { ReceiptPreview } from '@/components/ReceiptPreview';
import { useBusinessInfo } from '@/hooks/use-business-info';
import {
  Save, Plus, Trash2, Settings as SettingsIcon, Eye, Store, FileText, Copy, Palette, Tag, type LucideIcon,
} from 'lucide-react';

const MAX_CUSTOM_FIELDS = 20;

const colorPresets = [
  { name: 'Royal Blue', value: '217 91% 30%' },
  { name: 'Bright Blue', value: '221 83% 50%' },
  { name: 'Teal', value: '178 78% 28%' },
  { name: 'Emerald', value: '152 69% 31%' },
  { name: 'Purple', value: '262 60% 45%' },
  { name: 'Crimson', value: '350 72% 42%' },
  { name: 'Charcoal', value: '222 25% 20%' },
];

const sampleReceipt: Partial<ReceiptData> = {
  accountHolder: 'Amit Sharma', accountNumber: '987654321045', bankName: 'HDFC Bank', ifscCode: 'HDFC0005678',
  amount: '12000', date: '15/04/2026', transactionId: 'TXN1002', customerMobile: '+91 98765 43210',
};

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, updateCustomFields } = useAuth();
  // Display preferences are per device; custom fields belong to the account.
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>(user?.customFields || []);
  const [saving, setSaving] = useState(false);
  const business = useBusinessInfo();

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

  // The preview reflects unsaved changes, so build it from the local settings state.
  const previewBusiness = { ...business, showLogo: settings.showLogo, showName: settings.showName, primaryColor: settings.primaryColor };

  const toggles: { key: 'showLogo' | 'showName' | 'dualReceipt'; icon: LucideIcon; title: string; desc: string }[] = [
    { key: 'showLogo', icon: Store, title: 'Show business logo on receipt', desc: 'Display your shop logo at the top of the receipt' },
    { key: 'showName', icon: FileText, title: 'Show business name on receipt', desc: 'Include business name in the receipt header' },
    { key: 'dualReceipt', icon: Copy, title: 'Print dual receipts by default', desc: 'Print two copies of each receipt' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        className="animate-fade-in-up"
        icon={SettingsIcon}
        title="Settings"
        description="Customize your experience and receipt preferences"
        actions={
          <Button onClick={handleSave} disabled={saving} className="px-6">
            <Save /> {saving ? 'Saving…' : 'Save Settings'}
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,440px)]">
        <div className="stagger space-y-6">
          <FormSection icon={Eye} title="Receipt Display" description="Control what to show on your receipts">
            <div className="divide-y">
              {toggles.map(t => (
                <label key={t.key} htmlFor={t.key} className="group flex cursor-pointer items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="icon-tile icon-tile-pop h-10 w-10 bg-transparent text-navy/70"><t.icon className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-navy">{t.title}</span>
                    <span className="block text-sm text-muted-foreground">{t.desc}</span>
                  </span>
                  <Switch
                    id={t.key}
                    checked={settings[t.key]}
                    onCheckedChange={v => setSettings(prev => ({ ...prev, [t.key]: v }))}
                    className="scale-110"
                  />
                </label>
              ))}
            </div>
          </FormSection>

          <FormSection icon={Palette} title="Appearance" description="Personalize the look and feel of your receipts">
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="primaryColor" className="font-semibold text-navy">Receipt Color Theme (HSL)</Label>
                <div className="relative">
                  <Input
                    id="primaryColor"
                    value={settings.primaryColor}
                    onChange={e => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                    placeholder="217 91% 30%"
                    className="pl-11"
                  />
                  <span
                    className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full shadow ring-2 ring-white transition-colors"
                    style={{ backgroundColor: `hsl(${settings.primaryColor})` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Format: hue saturation% lightness%</p>
              </div>
              <div>
                <Label className="font-semibold text-navy">Quick presets</Label>
                <div className="mt-2 flex flex-wrap gap-3">
                  {colorPresets.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.name}
                      aria-label={c.name}
                      onClick={() => setSettings(prev => ({ ...prev, primaryColor: c.value }))}
                      className="h-10 w-10 rounded-full transition-all duration-200 hover:scale-110"
                      style={{
                        backgroundColor: `hsl(${c.value})`,
                        boxShadow: settings.primaryColor === c.value ? `0 0 0 3px hsl(var(--card)), 0 0 0 5px hsl(${c.value})` : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label className="font-semibold text-navy">Shades</Label>
                <div className="mt-2 flex gap-3">
                  <div className="h-10 w-10 rounded-full border" style={{ backgroundColor: `hsl(${settings.primaryColor})` }} />
                  <div className="h-10 w-10 rounded-full border" style={{ backgroundColor: `hsl(${settings.primaryColor} / 0.5)` }} />
                  <div className="h-10 w-10 rounded-full border" style={{ backgroundColor: `hsl(${settings.primaryColor} / 0.2)` }} />
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection
            icon={Plus}
            title="Custom Receipt Fields"
            description="Add additional fields to your receipt (optional)"
            actions={
              <Button size="sm" variant="outline" onClick={addCustomField} disabled={customFields.length >= MAX_CUSTOM_FIELDS}>
                <Plus /> Add Field
              </Button>
            }
          >
            {customFields.length === 0 && (
              <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                No custom fields added yet. Custom fields will appear on your receipts.
              </p>
            )}
            <div className="space-y-3">
              {customFields.map(cf => (
                <div key={cf.id} className="flex animate-fade-in-up items-center gap-2">
                  <div className="flex-1">
                    <IconInput
                      icon={Tag}
                      value={cf.label}
                      onChange={e => updateCustomField(cf.id, e.target.value)}
                      placeholder="Field label (e.g. Branch Name)"
                      maxLength={100}
                    />
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removeCustomField(cf.id)} className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label="Remove field">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </FormSection>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg">
              <Save /> {saving ? 'Saving…' : 'Save Settings'}
            </Button>
          </div>
        </div>

        <LivePreviewPanel subtitle="See how your receipt will look with current settings" className="animate-fade-in-up [animation-delay:0.15s]">
          <div className={settings.dualReceipt ? 'grid grid-cols-2 gap-2' : ''}>
            <ReceiptPreview data={sampleReceipt} business={previewBusiness} compact={settings.dualReceipt} />
            {settings.dualReceipt && <ReceiptPreview data={sampleReceipt} business={previewBusiness} compact />}
          </div>
        </LivePreviewPanel>
      </div>
    </div>
  );
}
