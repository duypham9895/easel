import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, MoonColors, SunColors } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';

export default function TabsLayout() {
  const { t } = useTranslation('common');
  const role = useAppStore(s => s.role);

  const tabBg = role === 'moon' ? MoonColors.card
              : role === 'sun' ? SunColors.card
              : Colors.card;
  const activeTint = role === 'moon' ? MoonColors.accentPrimary
                   : role === 'sun' ? SunColors.accentPrimary
                   : Colors.menstrual;
  const inactiveTint = role === 'moon' ? MoonColors.textHint
                     : role === 'sun' ? SunColors.textHint
                     : Colors.textHint;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarStyle: {
          backgroundColor: tabBg,
          borderTopColor: 'transparent',
          shadowColor: Colors.black,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 20,
          elevation: 10,
          height: 84,
          paddingBottom: 24,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabToday'),
          tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('tabCalendar'),
          tabBarIcon: ({ color }) => <Feather name="calendar" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabSettings'),
          tabBarIcon: ({ color }) => <Feather name="settings" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
