import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../src/store/auth';
import { theme } from '../../src/lib/theme';
import { ShieldCheck, User, Lock, Fingerprint } from 'lucide-react-native';

/**
 * Login Screen
 *
 * Enterprise login with biometric unlock support.
 */
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, biometricEnabled } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      Alert.alert('Login Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <ShieldCheck size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>Validiant Executive</Text>
          <Text style={styles.subtitle}>Field Operations Suite</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <User size={20} color={theme.colors.slate[400]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={theme.colors.slate[400]}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Lock size={20} color={theme.colors.slate[400]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={theme.colors.slate[400]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isSubmitting}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {biometricEnabled && (
            <TouchableOpacity style={styles.biometricButton}>
              <Fingerprint size={32} color={theme.colors.primary} />
              <Text style={styles.biometricText}>Unlock with Biometrics</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Secure Enterprise Environment</Text>
          <Text style={styles.versionText}>v1.0.0 (Forensic-Ready)</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  inner: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.slate[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.size['2xl'],
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.slate[900],
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.slate[500],
    fontWeight: theme.typography.weight.medium,
  },
  form: {
    gap: theme.spacing.md,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.slate[50],
    borderWidth: 1,
    borderColor: theme.colors.slate[200],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    height: 56,
    color: theme.colors.slate[900],
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
  },
  button: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  biometricText: {
    color: theme.colors.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
  },
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing['2xl'],
  },
  footerText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.slate[400],
    fontWeight: theme.typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  versionText: {
    fontSize: 10,
    color: theme.colors.slate[300],
    marginTop: 4,
  },
});
