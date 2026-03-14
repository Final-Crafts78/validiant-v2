import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { theme } from '../../src/lib/theme';
import { useAuthStore } from '../../src/store/auth';
import { useWorkspaceStore } from '../../src/store/workspace';
import { 
  LogOut, 
  Shield, 
  Settings, 
  Building2, 
  Fingerprint, 
  ChevronRight,
  User,
  Bell
} from 'lucide-react-native';

/**
 * Mobile Profile Screen
 *
 * User account settings, organization context, and security preferences.
 */
export default function ProfileScreen() {
  const { user, logout, biometricEnabled, setBiometricEnabled } = useAuthStore();
  const { activeOrgSlug } = useWorkspaceStore();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.fullName?.charAt(0) || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.fullName || 'User Name'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Working Context</Text>
        <View style={styles.card}>
          <View style={styles.menuItem}>
            <View style={styles.menuIconLabel}>
              <Building2 size={20} color={theme.colors.slate[400]} />
              <View>
                <Text style={styles.menuLabel}>Organization</Text>
                <Text style={styles.menuValue}>{activeOrgSlug || 'Personal'}</Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.colors.slate[300]} />
          </View>
          <View style={[styles.menuItem, styles.noBorder]}>
            <View style={styles.menuIconLabel}>
              <Shield size={20} color={theme.colors.slate[400]} />
              <View>
                <Text style={styles.menuLabel}>Access Role</Text>
                <Text style={styles.menuValue}>{user?.role || 'Executive'}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security & Privacy</Text>
        <View style={styles.card}>
          <View style={styles.menuItem}>
            <View style={styles.menuIconLabel}>
              <Fingerprint size={20} color={theme.colors.slate[400]} />
              <Text style={styles.menuLabel}>Enable Biometric Lock</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: theme.colors.slate[200], true: theme.colors.primary }}
              thumbColor={theme.colors.white}
            />
          </View>
          <TouchableOpacity style={[styles.menuItem, styles.noBorder]}>
            <View style={styles.menuIconLabel}>
              <Bell size={20} color={theme.colors.slate[400]} />
              <Text style={styles.menuLabel}>Notification Preferences</Text>
            </View>
            <ChevronRight size={18} color={theme.colors.slate[300]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <LogOut size={20} color={theme.colors.rose[600]} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Validiant Mobile v1.0.0</Text>
        <Text style={styles.footerSub}>Secure Field Operations Environment</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.slate[50],
  },
  profileHeader: {
    padding: theme.spacing['2xl'],
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.slate[100],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 32,
    fontWeight: theme.typography.weight.bold,
  },
  userName: {
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.slate[900],
  },
  userEmail: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.slate[500],
  },
  section: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.slate[200],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.slate[100],
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  menuIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  menuLabel: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.slate[700],
  },
  menuValue: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.slate[500],
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.rose[100],
    gap: theme.spacing.sm,
  },
  logoutText: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.rose[600],
  },
  footer: {
    alignItems: 'center',
    padding: theme.spacing['2xl'],
    gap: 4,
  },
  footerText: {
    fontSize: 10,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.slate[400],
  },
  footerSub: {
    fontSize: 10,
    color: theme.colors.slate[300],
  },
});
