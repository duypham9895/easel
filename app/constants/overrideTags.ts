export interface OverrideTagOption {
  /** Matches the tag value stored in the DB period_logs.tags column */
  id: string;
  /** i18n key in the 'calendar' namespace */
  labelKey: string;
  /** Feather icon name (from @expo/vector-icons) */
  icon: string;
  /** Accent color for the tag pill */
  color: string;
}

export const OVERRIDE_TAGS: OverrideTagOption[] = [
  { id: 'stress', labelKey: 'tagStress', icon: 'zap', color: '#FF5F7E' },
  { id: 'illness', labelKey: 'tagIllness', icon: 'thermometer', color: '#FFB347' },
  { id: 'travel', labelKey: 'tagTravel', icon: 'map-pin', color: '#70D6FF' },
  { id: 'medication', labelKey: 'tagMedication', icon: 'activity', color: '#4AD66D' },
  { id: 'other', labelKey: 'tagOther', icon: 'more-horizontal', color: '#8E8E93' },
];

export const VALID_OVERRIDE_TAGS = OVERRIDE_TAGS.map((t) => t.id);
