import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { subscribeToCoupleLinked } from '@/lib/db/couples';

/**
 * Moon-side Realtime listener.
 *
 * When BF enters GF's code and links, the `couples` row updates to
 * `status: 'linked'`. This hook fires `setLinked` immediately so the GF's
 * app reflects the linked state without requiring a restart.
 *
 * Only active when: role === 'moon' AND coupleId is set (code was generated)
 * AND isPartnerLinked is false (not yet linked).
 */
export function useCoupleLinkedListener() {
  const role = useAppStore((s) => s.role);
  const coupleId = useAppStore((s) => s.coupleId);
  const isPartnerLinked = useAppStore((s) => s.isPartnerLinked);
  const setLinked = useAppStore((s) => s.setLinked);

  useEffect(() => {
    if (role !== 'moon' || !coupleId || isPartnerLinked) return;

    return subscribeToCoupleLinked(coupleId, (couple) => {
      setLinked(couple.id);
    });
  }, [role, coupleId, isPartnerLinked, setLinked]);
}
