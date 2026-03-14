import { useRouter } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { theme } from '../../src/lib/theme';
import { useBrandStore } from '../../src/store/brand';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  Clock, 
  MapPin,
  AlertCircle
} from 'lucide-react-native';

/**
 * Executive My Cases Screen
 *
 * Displays a list of verification tasks assigned to the current executive.
 */
export default function CasesScreen() {
  const router = useRouter();
  const { getAccentColor } = useBrandStore();
  const accentColor = getAccentColor();

  // Mock data for initial UI - will be replaced by TanStack Query later
  const mockCases = [
    {
      id: 'VR-10023',
      type: 'Employment Verification',
      client: 'Goldman Sachs',
      status: 'In Progress',
      priority: 'High',
      deadline: '24h remaining',
      location: 'Mumbai, IN',
      isAtRisk: true,
    },
    {
      id: 'VR-10024',
      type: 'Address Verification',
      client: 'Google Cloud',
      status: 'Assigned',
      priority: 'Normal',
      deadline: '3 days remaining',
      location: 'Bangalore, IN',
      isAtRisk: false,
    },
    {
      id: 'VR-10025',
      type: 'Drug Test Scoping',
      client: 'Meta Platforms',
      status: 'Pending Review',
      priority: 'Low',
      deadline: '5 days remaining',
      location: 'Delhi, IN',
      isAtRisk: false,
    },
  ];

  const renderCaseItem = ({ item }: { item: typeof mockCases[0] }) => (
    <TouchableOpacity 
      style={styles.caseCard}
      onPress={() => router.push(`/(tabs)/case/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.idContainer}>
          <Text style={styles.caseId}>{item.id}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: item.priority === 'High' ? theme.colors.rose[50] : theme.colors.slate[50] }]}>
            <Text style={[styles.priorityText, { color: item.priority === 'High' ? theme.colors.rose[600] : theme.colors.slate[500] }]}>
              {item.priority}
            </Text>
          </View>
        </View>
        <ChevronRight size={18} color={theme.colors.slate[300]} />
      </View>

      <Text style={styles.caseTitle}>{item.type}</Text>
      <Text style={styles.clientName}>{item.client}</Text>

      <View style={styles.cardFooter}>
        <View style={styles.footerMeta}>
          <View style={styles.metaItem}>
            <MapPin size={12} color={theme.colors.slate[400]} />
            <Text style={styles.metaLabel}>{item.location}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={12} color={item.isAtRisk ? theme.colors.rose[500] : theme.colors.slate[400]} />
            <Text style={[styles.metaLabel, item.isAtRisk && { color: theme.colors.rose[500], fontWeight: 'bold' }]}>
              {item.deadline}
            </Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { borderColor: accentColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: accentColor }]} />
          <Text style={[styles.statusText, { color: accentColor }]}>{item.status}</Text>
        </View>
      </View>
      
      {item.isAtRisk && (
        <View style={styles.atRiskIndicator}>
          <AlertCircle size={10} color={theme.colors.white} />
          <Text style={styles.atRiskText}>AT RISK</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBar}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={theme.colors.slate[400]} />
          <Text style={styles.searchPlaceholder}>Search Case ID or Client...</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={theme.colors.slate[600]} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={mockCases}
        renderItem={renderCaseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Cases Found</Text>
            <Text style={styles.emptySubtitle}>You have no verification tasks assigned to you.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.slate[50], // Light grey background for laundry list
  },
  searchBar: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.slate[100],
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.slate[50],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    height: 44,
    gap: theme.spacing.sm,
  },
  searchPlaceholder: {
    color: theme.colors.slate[400],
    fontSize: theme.typography.size.sm,
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: theme.colors.slate[50],
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  caseCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.slate[100],
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  caseId: {
    fontSize: theme.typography.size.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.slate[400],
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: theme.typography.weight.bold,
    textTransform: 'uppercase',
  },
  caseTitle: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.slate[900],
    marginBottom: 2,
  },
  clientName: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.slate[500],
    fontWeight: theme.typography.weight.medium,
    marginBottom: theme.spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.slate[50],
  },
  footerMeta: {
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: 11,
    color: theme.colors.slate[400],
    fontWeight: theme.typography.weight.medium,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: theme.typography.weight.bold,
  },
  atRiskIndicator: {
    position: 'absolute',
    top: 0,
    right: 32,
    backgroundColor: theme.colors.rose[600],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  atRiskText: {
    color: theme.colors.white,
    fontSize: 9,
    fontWeight: theme.typography.weight.black,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing['2xl'],
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.slate[800],
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.slate[400],
    textAlign: 'center',
  },
});
