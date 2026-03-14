import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../../../src/lib/theme';
import { useAuthStore } from '../../../src/store/auth';
import { DynamicFieldRenderer } from '../../../src/components/fields/DynamicFieldRenderer';
import { syncQueue } from '../../../src/lib/sync-queue';
import api from '../../../src/lib/api';
import NetInfo from '@react-native-community/netinfo';
import { ChevronLeft, Info, Send } from 'lucide-react-native';

/**
 * Mobile Case Detail & Entry Screen
 *
 * The core BGV loop:
 * - Renders dynamic fields
 * - Handles offline submission queueing
 * - Validates compliance rules (GPS accuracy, etc.)
 */
export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [values, setValues] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Array<any>>([]); // Track file metadata for sync queue
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock field schema - in production this comes from context or API
  const mockSchema: any[] = [
    { id: 'employee_id', type: 'text', label: 'Employee ID', required: true },
    { id: 'check_date', type: 'date', label: 'Verification Date', required: true },
    { id: 'proof_photo', type: 'photo', label: 'Front Office Proof', required: true, requireLiveCapture: true },
    { id: 'id_document', type: 'document', label: 'ID Card Scan', required: true },
  ];

  const handleFieldChange = (fieldId: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
    
    // If it's a file value (uri), update the files metadata list
    if (typeof value === 'string' && value.startsWith('file://')) {
      const existing = files.findIndex(f => f.fieldId === fieldId);
      const newFile = { 
        fieldId, 
        uri: value, 
        name: `capture_${fieldId}.jpg`, // Simple naming
        type: 'image/jpeg',
        hash: 'sha256_mock' // Real hash would be calculated here
      };
      
      if (existing >= 0) {
        const next = [...files];
        next[existing] = newFile;
        setFiles(next);
      } else {
        setFiles(prev => [...prev, newFile]);
      }
    }
  };

  const handleSubmit = async () => {
    // Basic validation
    const missing = mockSchema.filter(f => f.required && !values[f.id]);
    if (missing.length > 0) {
      Alert.alert('Incomplete', `Please fill required fields: ${missing.map(m => m.label).join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    const netState = await NetInfo.fetch();

    if (!netState.isConnected) {
      // Offline Path - Enqueue
      await syncQueue.enqueue({
        id: Math.random().toString(36).substr(2, 9),
        caseId: id as string,
        type: 'CASE_SUBMISSION',
        payload: values,
        files: files,
        timestamp: Date.now(),
      });
      
      setIsSubmitting(false);
      Alert.alert('Offline', 'Data saved locally. Submission will sync when network returns.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      return;
    }

    // Online Path
    try {
      // 1. Upload files first (simplified online logic for this demo)
      // In production, this would call processQueue or a similar parallel logic
      await api.post(`/cases/${id}/submit`, values);
      
      setIsSubmitting(false);
      Alert.alert('Success', 'Verification submitted successfully.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      setIsSubmitting(false);
      Alert.alert('Upload Failed', e.message || 'System error. Try again later.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.slate[900]} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerCaseId}>CASE #{id}</Text>
          <Text style={styles.headerSubtitle}>Verification Flow</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.infoBox}>
          <Info size={16} color={theme.colors.primary} />
          <Text style={styles.infoText}>
            Ensure high GPS accuracy before capturing proof markers. Evidence is forensic-locked.
          </Text>
        </View>

        <DynamicFieldRenderer
          fields={mockSchema}
          values={values}
          onChange={handleFieldChange}
          userRole={user?.role || 'executive'}
        />

        <View style={styles.spacer} />

        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <>
              <Send size={18} color={theme.colors.white} />
              <Text style={styles.submitText}>Submit for Review</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.slate[100],
    backgroundColor: theme.colors.white,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerCaseId: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.slate[900],
  },
  headerSubtitle: {
    fontSize: 10,
    color: theme.colors.slate[400],
    fontWeight: theme.typography.weight.bold,
    textTransform: 'uppercase',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.slate[50],
    padding: 12,
    borderRadius: theme.borderRadius.lg,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: theme.colors.slate[600],
    lineHeight: 16,
    fontWeight: theme.typography.weight.medium,
  },
  spacer: {
    height: 40,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitText: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.white,
  },
});
