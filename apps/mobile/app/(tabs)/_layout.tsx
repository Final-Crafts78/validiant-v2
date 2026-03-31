import React from 'react';
import { Tabs } from 'expo-router';
import { theme } from '../../src/lib/theme';
import {
  LayoutDashboard,
  ClipboardList,
  UserCircle,
} from 'lucide-react-native';
import { useBrandStore } from '../../src/store/brand';

/**
 * Tab Navigation Layout
 *
 * Bottom tabs for Dashboard, Cases, and Profile.
 * Uses dynamic branding for accent colors.
 */
export default function TabLayout() {
  const { getAccentColor } = useBrandStore();
  const accentColor = getAccentColor();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: theme.colors.slate[400],
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: theme.colors.slate[100],
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: theme.typography.weight.semibold,
        },
        headerStyle: {
          backgroundColor: theme.colors.white,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.slate[100],
        },
        headerTitleStyle: {
          fontSize: theme.typography.size.md,
          fontWeight: theme.typography.weight.bold,
          color: theme.colors.slate[900],
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} />
          ),
          headerTitle: 'Executive Dashboard',
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: 'My Cases',
          tabBarLabel: 'Cases',
          tabBarIcon: ({ color, size }) => (
            <ClipboardList size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <UserCircle size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
