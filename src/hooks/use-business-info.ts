import { useAuth } from '@/contexts/AuthContext';
import { getSettings } from '@/lib/storage';
import { BusinessInfo } from '@/types/receipt';

// Business details from the user's profile combined with local display settings.
export function useBusinessInfo(): BusinessInfo {
  const { user } = useAuth();
  const settings = getSettings();
  return {
    name: user?.business.name || 'Quick Receipt',
    logo: user?.business.logo || null,
    address: user?.business.address || '',
    phone: user?.business.phone || '',
    showLogo: settings.showLogo,
    showName: settings.showName,
    showWatermark: settings.showWatermark,
    primaryColor: settings.primaryColor,
  };
}
