/**
 * Profile Screen
 * 
 * User profile, settings, and account management.
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { useMutation } from '@tanstack/react-query';
import { logout } from '@/services/auth.service';
import { getErrorMessage } from '@/services/api';

/**
 * Profile section component
 */
function ProfileSection({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

/**
 * Menu item component
 */
function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  danger = false,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <View style={styles.menuTextContainer}>
          <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>
            {title}
          </Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && <Text style={styles.menuArrow}>›</Text>}
    </TouchableOpacity>
  );
}

/**
 * Info item component for displaying user details
 */
function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <View style={styles.infoItem}>
      <View style={styles.infoIcon}>
        <Text style={styles.infoIconText}>{icon}</Text>
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

/**
 * Profile Screen Component
 */
export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      // Clear local auth state
      await clearAuth();
      
      // Navigate to login
      router.replace('/login');
    },
    onError: (err) => {
      // Even if API call fails, clear local state
      const message = getErrorMessage(err);
      Alert.alert('Logout Error', message, [
        {
          text: 'OK',
          onPress: async () => {
            await clearAuth();
            router.replace('/login');
          },
        },
      ]);
    },
  });

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => logoutMutation.mutate(),
        },
      ],
      { cancelable: true }
    );
  };

  // Loading state
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
          </Text>
        </View>
        <Text style={styles.userName}>
          {user.firstName} {user.lastName}
        </Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Text>
        </View>
      </View>

      {/* Account Information */}
      <View style={styles.section}>
        <ProfileSection title="Account Information" />
        <View style={styles.card}>
          <InfoItem
            icon="👤"
            label="Full Name"
            value={`${user.firstName} ${user.lastName}`}
          />
          <View style={styles.divider} />
          <InfoItem
            icon="📧"
            label="Email"
            value={user.email}
          />
          <View style={styles.divider} />
          <InfoItem
            icon="🏷️"
            label="Role"
            value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          />
          <View style={styles.divider} />
          <InfoItem
            icon="📅"
            label="Member Since"
            value={new Date(user.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          />
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <ProfileSection title="Settings" />
        <View style={styles.card}>
          <MenuItem
            icon="👤"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => {
              // TODO: Navigate to edit profile
              Alert.alert('Coming Soon', 'Edit profile feature is coming soon!');
            }}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="🔔"
            title="Notifications"
            subtitle="Manage notification preferences"
            onPress={() => {
              // TODO: Navigate to notifications settings
              Alert.alert('Coming Soon', 'Notifications settings coming soon!');
            }}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="🔒"
            title="Privacy & Security"
            subtitle="Password, security settings"
            onPress={() => {
              // TODO: Navigate to privacy settings
              Alert.alert('Coming Soon', 'Privacy settings coming soon!');
            }}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="🌙"
            title="Appearance"
            subtitle="Theme and display settings"
            onPress={() => {
              // TODO: Navigate to appearance settings
              Alert.alert('Coming Soon', 'Appearance settings coming soon!');
            }}
          />
        </View>
      </View>

      {/* Help & Support */}
      <View style={styles.section}>
        <ProfileSection title="Help & Support" />
        <View style={styles.card}>
          <MenuItem
            icon="❓"
            title="Help Center"
            subtitle="FAQs and guides"
            onPress={() => {
              Alert.alert('Coming Soon', 'Help center coming soon!');
            }}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="💬"
            title="Contact Support"
            subtitle="Get help from our team"
            onPress={() => {
              Alert.alert('Coming Soon', 'Contact support coming soon!');
            }}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="📄"
            title="Terms & Privacy"
            subtitle="Legal information"
            onPress={() => {
              Alert.alert('Coming Soon', 'Terms & Privacy coming soon!');
            }}
          />
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <ProfileSection title="About" />
        <View style={styles.card}>
          <MenuItem
            icon="ℹ️"
            title="App Version"
            subtitle="2.0.0"
            onPress={() => {}}
            showArrow={false}
          />
        </View>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[
            styles.logoutButton,
            logoutMutation.isPending && styles.logoutButtonDisabled,
          ]}
          onPress={handleLogout}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={styles.logoutText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 12,
    width: 32,
    textAlign: 'center',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  menuTitleDanger: {
    color: '#FF3B30',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#666666',
  },
  menuArrow: {
    fontSize: 24,
    color: '#cccccc',
    marginLeft: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoIconText: {
    fontSize: 20,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 56,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  bottomSpacer: {
    height: 32,
  },
});
