/**
 * Projects Screen
 * 
 * View and manage projects.
 * TODO: Implement project list, filtering, and creation.
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
 * Projects Screen Component
 */
export default function ProjectsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch projects
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
        <Text style={styles.emptyIcon}>📁</Text>
        <Text style={styles.emptyTitle}>No Projects Yet</Text>
        <Text style={styles.emptyDescription}>
          Create your first project to start organizing your work and
          collaborating with your team.
        </Text>

        {/* Create Project Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            // TODO: Navigate to create project screen
            console.log('Create project');
          }}
        >
          <Text style={styles.createButtonText}>+ Create Project</Text>
        </TouchableOpacity>
      </View>

      {/* Info Cards */}
      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>✨</Text>
          <Text style={styles.infoTitle}>Stay Organized</Text>
          <Text style={styles.infoDescription}>
            Keep all your projects, tasks, and team members in one place.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>👥</Text>
          <Text style={styles.infoTitle}>Collaborate</Text>
          <Text style={styles.infoDescription}>
            Invite team members and work together seamlessly.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>📈</Text>
          <Text style={styles.infoTitle}>Track Progress</Text>
          <Text style={styles.infoDescription}>
            Monitor project status and team performance in real-time.
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
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    gap: 12,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
  },
  infoIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
  },
  infoDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});
