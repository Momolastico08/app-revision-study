import { useState, useEffect } from 'react';
import { getCustomerInfo, isPro } from '@/services/revenuecat';
import { SubscriptionTier } from '@/types';

interface SubscriptionState {
  tier: SubscriptionTier;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useSubscription(): SubscriptionState {
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const info = await getCustomerInfo();
      setTier(isPro(info) ? 'pro' : 'free');
    } catch {
      setTier('free');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { tier, loading, refresh };
}
