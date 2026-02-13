/**
 * Register Screen
 * 
 * User registration with full validation and terms acceptance.
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';

import { register } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth';
import { getErrorMessage } from '@/services/api';

/**
 * Register form schema with comprehensive validation
 */
const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be less than 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters'),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must be less than 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters'),
    email: z
      .string()
      .email('Invalid email address')
      .toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and number'
      ),
    confirmPassword: z.string(),
    termsAccepted: z
      .boolean()
      .refine((val) => val === true, 'You must accept the terms and conditions'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

/**
 * Register Screen Component
 */
export default function RegisterScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string>('');

  // Form with default values
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
    },
  });

  // Watch password for validation feedback
  const password = watch('password');

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: async (data) => {
      // Save auth data
      await setAuth(data.user, data.token, data.refreshToken);
      
      // Show success message
      Alert.alert(
        'Welcome!',
        'Your account has been created successfully.',
        [
          {
            text: 'Get Started',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    },
    onError: (err) => {
      const message = getErrorMessage(err);
      setError(message);
      Alert.alert('Registration Failed', message);
    },
  });

  // Handle submit
  const onSubmit = (data: RegisterForm) => {
    setError('');
    const { firstName, lastName, email, password } = data;
    registerMutation.mutate({ firstName, lastName, email, password });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* First Name Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.firstName && styles.inputError,
                  ]}
                  placeholder="Enter your first name"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                  autoComplete="name-given"
                  autoCorrect={false}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  editable={!registerMutation.isPending}
                />
              )}
            />
            {errors.firstName && (
              <Text style={styles.fieldError}>{errors.firstName.message}</Text>
            )}
          </View>

          {/* Last Name Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.lastName && styles.inputError,
                  ]}
                  placeholder="Enter your last name"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                  autoComplete="name-family"
                  autoCorrect={false}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  editable={!registerMutation.isPending}
                />
              )}
            />
            {errors.lastName && (
              <Text style={styles.fieldError}>{errors.lastName.message}</Text>
            )}
          </View>

          {/* Email Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.email && styles.inputError,
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  editable={!registerMutation.isPending}
                />
              )}
            />
            {errors.email && (
              <Text style={styles.fieldError}>{errors.email.message}</Text>
            )}
          </View>

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.password && styles.inputError,
                  ]}
                  placeholder="Create a password"
                  placeholderTextColor="#999"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
                  autoCorrect={false}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  editable={!registerMutation.isPending}
                />
              )}
            />
            {errors.password && (
              <Text style={styles.fieldError}>{errors.password.message}</Text>
            )}
            {/* Password strength hint */}
            {password && !errors.password && (
              <Text style={styles.hint}>
                ✓ Strong password (uppercase, lowercase, number)
              </Text>
            )}
          </View>

          {/* Confirm Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.confirmPassword && styles.inputError,
                  ]}
                  placeholder="Confirm your password"
                  placeholderTextColor="#999"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
                  autoCorrect={false}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  editable={!registerMutation.isPending}
                />
              )}
            />
            {errors.confirmPassword && (
              <Text style={styles.fieldError}>
                {errors.confirmPassword.message}
              </Text>
            )}
          </View>

          {/* Terms Acceptance */}
          <View style={styles.termsContainer}>
            <Controller
              control={control}
              name="termsAccepted"
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => onChange(!value)}
                  disabled={registerMutation.isPending}
                >
                  <View
                    style={[
                      styles.checkboxBox,
                      value && styles.checkboxChecked,
                      errors.termsAccepted && styles.checkboxError,
                    ]}
                  >
                    {value && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.termsText}>
                    I agree to the{' '}
                    <Text style={styles.link}>Terms and Conditions</Text>
                  </Text>
                </TouchableOpacity>
              )}
            />
            {errors.termsAccepted && (
              <Text style={styles.fieldError}>
                {errors.termsAccepted.message}
              </Text>
            )}
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.button,
              registerMutation.isPending && styles.buttonDisabled,
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              disabled={registerMutation.isPending}
            >
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 48,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#ff0000',
  },
  fieldError: {
    color: '#ff0000',
    fontSize: 12,
    marginTop: 4,
  },
  hint: {
    color: '#22c55e',
    fontSize: 12,
    marginTop: 4,
  },
  termsContainer: {
    marginBottom: 24,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#dddddd',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxError: {
    borderColor: '#ff0000',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  link: {
    color: '#007AFF',
    fontWeight: '600',
  },
  button: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
  },
  linkText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});
