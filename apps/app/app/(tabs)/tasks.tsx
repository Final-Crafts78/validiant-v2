/**
 * Tasks Screen
 * 
 * View and manage tasks.
 * TODO: Implement task list, filtering, sorting, and creation.
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
 * Tasks Screen Component
 */
export default function TasksScreen() {
  const [refreshing, setRefreshing] = useState(false);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch tasks
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
        <Text style={styles.emptyIcon}>✓</Text>
        <Text style={styles.emptyTitle}>No Tasks Yet</Text>
        <Text style={styles.emptyDescription}>
          Create tasks to break down your projects into manageable pieces and
          track progress.
        </Text>

        {/* Create Task Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            // TODO: Navigate to create task screen
            console.log('Create task');
          }}
        >
          <Text style={styles.createButtonText}>+ Create Task</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>To Do</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
        
        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>✓</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Break It Down</Text>
            <Text style={styles.tipDescription}>
              Split large tasks into smaller, actionable subtasks.
            </Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>🏷️</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Use Labels</Text>
            <Text style={styles.tipDescription}>
              Organize tasks with tags for easy filtering and searching.
            </Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>📅</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Set Due Dates</Text>
            <Text style={styles.tipDescription}>
              Add deadlines to stay on track and prioritize effectively.
            </Text>
          </View>
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
    marginBottom: 16,
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
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  tipsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  tipCard: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 12,
    width: 32,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  tipDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
});
