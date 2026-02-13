/**
 * Tabs Layout
 * 
 * Main app navigation with bottom tabs.
 */

import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

/**
 * Simple icon component using emoji for now
 * TODO: Replace with proper icon library (e.g., expo-vector-icons)
 */
function TabBarIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    home: '🏠',
    projects: '📁',
    tasks: '✓',
    organizations: '🏢',
    profile: '👤',
  };

  return (
    <span
      style={{
        fontSize: 24,
        opacity: focused ? 1 : 0.5,
      }}
    >
      {icons[name] || '•'}
    </span>
  );
}

/**
 * Tabs Layout Component
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#f0f0f0',
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: '#000000',
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="home" focused={focused} />
          ),
        }}
      />

      {/* Projects Tab */}
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarLabel: 'Projects',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="projects" focused={focused} />
          ),
        }}
      />

      {/* Tasks Tab */}
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarLabel: 'Tasks',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="tasks" focused={focused} />
          ),
        }}
      />

      {/* Organizations Tab */}
      <Tabs.Screen
        name="organizations"
        options={{
          title: 'Organizations',
          tabBarLabel: 'Teams',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="organizations" focused={focused} />
          ),
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
