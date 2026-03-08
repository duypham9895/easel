import {
  getCurrentDayInCycle,
  getCurrentPhase,
  getDaysUntilNextPeriod,
  getConceptionChance,
  buildCalendarMarkers,
} from '@/utils/cycleCalculator';

describe('cycleCalculator', () => {
  describe('getCurrentDayInCycle', () => {
    it('returns 1 when last period started today', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(getCurrentDayInCycle(today, 28)).toBe(1);
    });

    it('returns correct day within first cycle', () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      const dateStr = tenDaysAgo.toISOString().split('T')[0];
      expect(getCurrentDayInCycle(dateStr, 28)).toBe(11);
    });

    it('wraps around after cycle completes', () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateStr = thirtyDaysAgo.toISOString().split('T')[0];
      // Day 30 in a 28-day cycle = day 3 of next cycle (30 % 28 = 2, +1 = 3)
      expect(getCurrentDayInCycle(dateStr, 28)).toBe(3);
    });

    it('returns 1 for future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      expect(getCurrentDayInCycle(dateStr, 28)).toBe(1);
    });

    it('handles 21-day short cycle', () => {
      const twentyOneDaysAgo = new Date();
      twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21);
      const dateStr = twentyOneDaysAgo.toISOString().split('T')[0];
      expect(getCurrentDayInCycle(dateStr, 21)).toBe(1); // Exactly one cycle = day 1
    });
  });

  describe('getCurrentPhase', () => {
    // Standard 28-day cycle, 5-day period, ovulation day = 14
    it('returns menstrual for days 1-5', () => {
      expect(getCurrentPhase(1, 28, 5)).toBe('menstrual');
      expect(getCurrentPhase(5, 28, 5)).toBe('menstrual');
    });

    it('returns follicular for days 6-11', () => {
      expect(getCurrentPhase(6, 28, 5)).toBe('follicular');
      expect(getCurrentPhase(11, 28, 5)).toBe('follicular');
    });

    it('returns ovulatory for days 11-16 (around ovulation day 14)', () => {
      // ovulation day = 28-14 = 14; ovulatory window = 14-3 to 14+2 = 11-16
      expect(getCurrentPhase(12, 28, 5)).toBe('ovulatory');
      expect(getCurrentPhase(14, 28, 5)).toBe('ovulatory');
      expect(getCurrentPhase(16, 28, 5)).toBe('ovulatory');
    });

    it('returns luteal for days 17-28', () => {
      expect(getCurrentPhase(17, 28, 5)).toBe('luteal');
      expect(getCurrentPhase(28, 28, 5)).toBe('luteal');
    });

    it('handles short 21-day cycle', () => {
      // ovulation day = max(6, 21-14) = 7; menstrual 1-5, follicular 6 (just day 6, actually 6 to 7-3=4 -> follicular is empty)
      expect(getCurrentPhase(1, 21, 5)).toBe('menstrual');
      expect(getCurrentPhase(5, 21, 5)).toBe('menstrual');
    });
  });

  describe('getDaysUntilNextPeriod', () => {
    it('returns correct days remaining', () => {
      expect(getDaysUntilNextPeriod(1, 28)).toBe(28);
      expect(getDaysUntilNextPeriod(14, 28)).toBe(15);
      expect(getDaysUntilNextPeriod(28, 28)).toBe(1);
    });

    it('returns full cycle length when at/past end', () => {
      // day 29 in a 28-day cycle: remaining would be 0, so returns avgCycleLength
      expect(getDaysUntilNextPeriod(29, 28)).toBe(28);
    });
  });

  describe('getConceptionChance', () => {
    it('returns correct chance per phase', () => {
      expect(getConceptionChance('menstrual')).toBe('Low');
      expect(getConceptionChance('follicular')).toBe('Medium');
      expect(getConceptionChance('ovulatory')).toBe('Very High');
      expect(getConceptionChance('luteal')).toBe('Low');
    });
  });

  describe('buildCalendarMarkers', () => {
    it('generates markers for 3 cycles', () => {
      const today = new Date().toISOString().split('T')[0];
      const markers = buildCalendarMarkers(today, 28, 5);

      // Should have period markers for 3 cycles (5 days each = 15), plus ovulation (3) and fertile (up to 9)
      const periodDays = Object.values(markers).filter(m => m.type === 'period');
      expect(periodDays.length).toBe(15); // 3 cycles × 5 days

      const ovulationDays = Object.values(markers).filter(m => m.type === 'ovulation');
      expect(ovulationDays.length).toBe(3); // 1 per cycle
    });

    it('marks correct date as ovulation', () => {
      const start = new Date('2026-01-01');
      const markers = buildCalendarMarkers('2026-01-01', 28, 5);

      // Ovulation day = 28 - 14 = day 14 → Jan 14
      expect(markers['2026-01-14']).toEqual({ type: 'ovulation' });
    });

    it('marks period days correctly', () => {
      const markers = buildCalendarMarkers('2026-01-01', 28, 5);
      expect(markers['2026-01-01']).toEqual({ type: 'period' });
      expect(markers['2026-01-05']).toEqual({ type: 'period' });
      expect(markers['2026-01-06']).toBeUndefined(); // follicular, no marker
    });
  });
});
