import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../../src/lib/theme';
import { useAuthStore } from '../../src/store/auth';
import {
  ClipboardCheck,
  Clock,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react-native';

/**
 * Executive Dashboard
 * High-level overview of assigned verification tasks.
 */
export default function DashboardScreen() {
  const { user } = useAuthStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.fullName || 'Executive'}</Text>
      </View>

      {/* KPI Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#eff6ff' }]}>
          <ClipboardCheck size={20} color={theme.colors.primary} />
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Assigned</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fdf2f8' }]}>
          <Clock size={20} color={theme.colors.rose[600]} />
          <Text style={styles.statValue}>4</Text>
          <Text style={styles.statLabel}>Expiring</Text>
        </View>
      </View>

      {/* SLA Alert Section */}
      <TouchableOpacity style={styles.alertBanner}>
        <View style={styles.alertIconContent}>
          <AlertTriangle size={20} color={theme.colors.rose[600]} />
          <View style={styles.alertTextContent}>
            <Text style={styles.alertTitle}>2 Cases Breached SLA</Text>
            <Text style={styles.alertSubtitle}>Immediate action required</Text>
          </View>
        </View>
        <ChevronRight size={20} color={theme.colors.rose[600]} />
      </TouchableOpacity>

      {/* Recent Activity Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Progress</Text>
          <TrendingUp size={16} color={theme.colors.slate[400]} />
        </View>

        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.activityItem}>
            <View style={styles.activityIndicator} />
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>
                Verified{' '}
                <Text style={styles.activityBold}>Employment Check</Text> for
                Case #VR-2024-{i}
              </Text>
              <Text style={styles.activityTime}>{i * 2} hours ago</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  greeting: {
    fontSize: theme.typography.size.md,
    color: theme.colors.slate[500],
    fontWeight: theme.typography.weight.medium,
  },
  userName: {
    fontSize: theme.typography.size['2xl'],
    color: theme.colors.slate[900],
    fontWeight: theme.typography.weight.bold,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.slate[900],
  },
  statLabel: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.slate[600],
    fontWeight: theme.typography.weight.semibold,
    textTransform: 'uppercase',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff1f2',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#fecdd3',
    marginBottom: theme.spacing.xl,
  },
  alertIconContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  alertTextContent: {
    gap: 2,
  },
  alertTitle: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.rose[600],
  },
  alertSubtitle: {
    fontSize: 11,
    color: theme.colors.rose[500],
    fontWeight: theme.typography.weight.medium,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.slate[800],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activityItem: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  activityIndicator: {
    width: 2,
    backgroundColor: theme.colors.slate[100],
    borderRadius: 1,
    marginVertical: 4,
  },
  activityContent: {
    flex: 1,
    gap: 4,
  },
  activityText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.slate[600],
    lineHeight: 20,
  },
  activityBold: {
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.slate[900],
  },
  activityTime: {
    fontSize: 11,
    color: theme.colors.slate[400],
  },
});
