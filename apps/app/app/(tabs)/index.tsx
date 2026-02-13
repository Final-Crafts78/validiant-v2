/**
 * Home Dashboard Screen
 * 
 * Main dashboard showing overview, stats, and quick actions.
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { useState } from 'react';

/**
 * Quick action button component
 */
function QuickActionButton({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <Text style={styles.quickActionIcon}>{icon}</Text>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );
}

/**
 * Stat card component
 */
function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

/**
 * Home Dashboard Screen Component
 */
export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [refreshing, setRefreshing] = useState(false);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch fresh data
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Loading state (will be replaced with actual data fetching)
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>
          {user.firstName} {user.lastName}
        </Text>
        <Text style={styles.welcomeSubtext}>
          Here's what's happening with your projects today.
        </Text>
      </View>

      {/* Stats Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Active Projects"
            value="0"
            icon="📁"
            color="#007AFF"
          />
          <StatCard
            title="Tasks To Do"
            value="0"
            icon="✓"
            color="#FF9500"
          />
          <StatCard
            title="In Progress"
            value="0"
            icon="🔄"
            color="#5856D6"
          />
          <StatCard
            title="Completed"
            value="0"
            icon="✔️"
            color="#34C759"
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <QuickActionButton
            title="New Project"
            icon="➕"
            onPress={() => {
              // TODO: Navigate to create project
              router.push('/projects');
            }}
          />
          <QuickActionButton
            title="New Task"
            icon="✓"
            onPress={() => {
              // TODO: Navigate to create task
              router.push('/tasks');
            }}
          />
          <QuickActionButton
            title="Organizations"
            icon="🏢"
            onPress={() => {
              router.push('/organizations');
            }}
          />
          <QuickActionButton
            title="Settings"
            icon="⚙️"
            onPress={() => {
              router.push('/profile');
            }}
          />
        </View>
      </View>

      {/* Recent Activity Placeholder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📅</Text>
          <Text style={styles.emptyStateText}>No recent activity</Text>
          <Text style={styles.emptyStateSubtext}>
            Your recent activities will appear here
          </Text>
        </View>
      </View>

      {/* Getting Started Placeholder */}
      <View style={styles.section}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚀 Getting Started</Text>
          <Text style={styles.cardText}>
            Welcome to Validiant! Start by creating your first project or join
            an existing organization.
          </Text>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => router.push('/projects')}
          >
            <Text style={styles.cardButtonText}>Get Started →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  welcomeSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    minWidth: '47%',
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statTitle: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardButton: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cardButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
});
