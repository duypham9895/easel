import { CyclePhase } from '@/types';
import { Colors } from './theme';

export interface PhaseInfo {
  key: CyclePhase;
  name: string;
  tagline: string;
  color: string;
  // Boyfriend-facing content
  moodDescription: string;
  partnerAdvice: string;
  // Quick tips for GF
  selfCareTip: string;
}

export const PHASE_INFO: Record<CyclePhase, PhaseInfo> = {
  menstrual: {
    key: 'menstrual',
    name: 'Menstrual',
    tagline: 'Rest & Restore',
    color: Colors.menstrual,
    moodDescription: 'She may feel tired and more emotional than usual. Her body is working hard.',
    partnerAdvice: 'Prepare warm drinks, comfort food, and simply be present. No big plans today.',
    selfCareTip: 'Your body deserves rest. Light stretching and warmth are your best friends.',
  },
  follicular: {
    key: 'follicular',
    name: 'Follicular',
    tagline: 'Rising Energy',
    color: Colors.follicular,
    moodDescription: 'She feels optimistic and open to new experiences. A great time for fun plans.',
    partnerAdvice: 'Plan a date! She is in an adventurous, social mood. Suggest something new.',
    selfCareTip: "Energy is building. It's a great time to start new projects or try new activities.",
  },
  ovulatory: {
    key: 'ovulatory',
    name: 'Ovulatory',
    tagline: 'Peak & Glow',
    color: Colors.ovulatory,
    moodDescription: 'She feels confident, magnetic, and at her social peak. She is glowing.',
    partnerAdvice: 'A surprise compliment or a small gift will go a long way right now. Show up for her.',
    selfCareTip: 'You are at your most vibrant. Embrace social events and meaningful conversations.',
  },
  luteal: {
    key: 'luteal',
    name: 'Luteal',
    tagline: 'Wind Down',
    color: Colors.luteal,
    moodDescription: 'She may feel more sensitive or irritable. PMS symptoms can emerge in this phase.',
    partnerAdvice: 'Be patient, listen without judgment. Stock up on her favorite snacks and avoid arguments.',
    selfCareTip: 'Prioritize cozy activities, reduce caffeine, and be gentle with yourself.',
  },
};
