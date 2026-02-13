/**
 * Organizations Screen
 * 
 * View and manage organizations/teams.
 * TODO: Implement organization list, creation, and management.
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useState } from 'react';

/**
 * Organizations Screen Component
 */
export default function OrganizationsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch organizations
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Empty State */}
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🏢</Text>
        <Text style={styles.emptyTitle}>No Organizations Yet</Text>
        <Text style={styles.emptyDescription}>
          Create or join an organization to collaborate with your team and
          manage projects together.
        </Text>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              // TODO: Navigate to create organization screen
              console.log('Create organization');
            }}
          >
            <Text style={styles.primaryButtonText}>+ Create Organization</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              // TODO: Navigate to join organization screen
              console.log('Join organization');
            }}
          >
            <Text style={styles.secondaryButtonText}>Join Organization</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Benefits Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Organizations?</Text>

        <View style={styles.benefitCard}>
          <View style={styles.benefitIcon}>
            <Text style={styles.benefitIconText}>👥</Text>
          </View>
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>Team Collaboration</Text>
            <Text style={styles.benefitDescription}>
              Work together with your team members on shared projects and tasks.
            </Text>
          </View>
        </View>

        <View style={styles.benefitCard}>
          <View style={styles.benefitIcon}>
            <Text style={styles.benefitIconText}>🔒</Text>
          </View>
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>Access Control</Text>
            <Text style={styles.benefitDescription}>
              Manage permissions and roles to control who can access what.
            </Text>
          </View>
        </View>

        <View style={styles.benefitCard}>
          <View style={styles.benefitIcon}>
            <Text style={styles.benefitIconText}>📈</Text>
          </View>
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>Centralized Management</Text>
            <Text style={styles.benefitDescription}>
              Keep all your projects, resources, and team in one place.
            </Text>
          </View>
        </View>

        <View style={styles.benefitCard}>
          <View style={styles.benefitIcon}>
            <Text style={styles.benefitIconText}>⚙️</Text>
          </View>
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>Custom Settings</Text>
            <Text style={styles.benefitDescription}>
              Configure organization-wide settings and preferences.
            </Text>
          </View>
        </View>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerIcon}>ℹ️</Text>
        <View style={styles.infoBannerContent}>
          <Text style={styles.infoBannerTitle}>Need Help?</Text>
          <Text style={styles.infoBannerText}>
            Organizations help teams collaborate effectively. You can be a member
            of multiple organizations.
          </Text>
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
    flexGrow: 1,
    padding: 16,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  benefitCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 12,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  benefitIconText: {
    fontSize: 24,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  infoBanner: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
  },
  infoBannerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoBannerContent: {
    flex: 1,
  },
  infoBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 4,
  },
  infoBannerText: {
    fontSize: 13,
    color: '#1565c0',
    lineHeight: 18,
  },
});
