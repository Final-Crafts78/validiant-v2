/**
 * Profile Page
 *
 * User profile and account settings — Phase 8 Corporate Light Theme.
 */

'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { updateProfileAction } from '@/actions/auth.actions';
import { format } from 'date-fns';
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Save,
  Camera,
  Loader2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Shared style constants — mirror Tasks / Projects pages exactly
// ---------------------------------------------------------------------------
const inputCls =
  'w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm ' +
  'text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ' +
  'focus:ring-blue-600 focus:border-transparent disabled:bg-slate-50 ' +
  'disabled:text-slate-400 disabled:cursor-not-allowed transition-shadow';

const labelCls = 'block text-sm font-semibold text-slate-700 mb-1.5';

const btnPrimary =
  'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 ' +
  'text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 ' +
  'disabled:cursor-not-allowed';

const btnGhost =
  'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 ' +
  'bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors ' +
  'disabled:opacity-60 disabled:cursor-not-allowed';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Split fullName for display and editing
  const nameComponents = useMemo(() => {
    if (!user || !user.fullName) return { firstName: '', lastName: '' };
    const parts = user.fullName.trim().split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    return { firstName, lastName };
  }, [user]);

  // Controlled form state for profile tab
  const [firstName, setFirstName] = useState(nameComponents.firstName);
  const [lastName, setLastName] = useState(nameComponents.lastName);
  const [bio, setBio] = useState(user?.bio || '');

  // Update form state when user data changes (e.g., after refresh)
  useEffect(() => {
    setFirstName(nameComponents.firstName);
    setLastName(nameComponents.lastName);
    setBio(user?.bio || '');
  }, [user?.fullName, user?.bio, nameComponents.firstName, nameComponents.lastName]);

  // Get initials from fullName with null-safety
  const initials = useMemo(() => {
    if (!user || !user.fullName) return '';
    const parts = user.fullName.trim().split(' ');
    const firstInitial = parts[0]?.charAt(0) || '';
    const lastInitial = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }, [user]);

  /**
   * Handle profile form submission
   * CRITICAL: Combines firstName and lastName into fullName before sending
   */
  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      alert('Please enter both first and last name');
      return;
    }

    if (!user) {
      alert('User data not available');
      return;
    }

    startTransition(async () => {
      try {
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

        console.log('[ProfilePage] Submitting profile update:', { fullName, bio: bio.trim() });

        const result = await updateProfileAction({
          fullName,
          bio: bio.trim() || undefined,
        });

        if (result.success && result.user) {
          console.log('[ProfilePage] Profile updated successfully:', result.user);

          const mergedUserData = {
            ...user,
            ...result.user,
            updatedAt: result.user.updatedAt || new Date().toISOString(),
          };

          updateUser(mergedUserData);
          alert('Profile updated successfully!');
        } else {
          console.error('[ProfilePage] Profile update failed:', result);
          alert(result.message || 'Failed to update profile');
        }
      } catch (error) {
        console.error('[ProfilePage] Unexpected error:', error);
        alert('An unexpected error occurred. Please try again.');
      }
    });
  };

  /** Handle cancel — reset form to original values */
  const handleCancel = () => {
    setFirstName(nameComponents.firstName);
    setLastName(nameComponents.lastName);
    setBio(user?.bio || '');
  };

  if (!user) return null;

  // -------------------------------------------------------------------------
  // Tab configuration
  // -------------------------------------------------------------------------
  const tabs: { id: 'profile' | 'security' | 'notifications'; label: string }[] = [
    { id: 'profile', label: 'Profile Information' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
  ];

  return (
    <div className="space-y-6">

      {/* ------------------------------------------------------------------ */}
      {/* Page Header                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Profile Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal information and security preferences
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Profile Hero Card                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-20 h-20 rounded-full object-cover ring-2 ring-slate-200"
              />
            ) : (
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold select-none">
                {initials}
              </div>
            )}
            <button
              type="button"
              aria-label="Change avatar"
              className="absolute bottom-0 right-0 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Camera className="h-3.5 w-3.5 text-slate-500" />
            </button>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900 truncate">{user.fullName}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {/* Active badge */}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
              </span>
              {/* Verified badge */}
              {user.emailVerified && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Verified
                </span>
              )}
              <span className="text-xs text-slate-400">
                Member since {format(new Date(user.createdAt), 'MMMM yyyy')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Tab Navigation                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1" aria-label="Profile sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 pb-3 pt-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ================================================================== */}
      {/* TAB: PROFILE INFORMATION                                            */}
      {/* ================================================================== */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4 mb-6">
            Personal Information
          </h3>
          <form className="space-y-5" onSubmit={handleProfileSubmit}>

            {/* First / Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="firstName" className={labelCls}>First Name</label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputCls}
                  disabled={isPending}
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className={labelCls}>Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputCls}
                  disabled={isPending}
                  required
                />
              </div>
            </div>

            {/* Email — read-only */}
            <div>
              <label htmlFor="email" className={labelCls}>Email Address</label>
              <input
                id="email"
                type="email"
                value={user.email}
                className={inputCls}
                disabled
                readOnly
              />
              <p className="text-xs text-slate-400 mt-1">
                Email address cannot be changed from this page.
              </p>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className={labelCls}>Bio</label>
              <textarea
                id="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className={`${inputCls} resize-none`}
                disabled={isPending}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className={btnGhost}
                onClick={handleCancel}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={btnPrimary}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB: SECURITY                                                        */}
      {/* ================================================================== */}
      {activeTab === 'security' && (
        <div className="space-y-6">

          {/* Change Password card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4 mb-6">
              Change Password
            </h3>
            <form className="space-y-5">

              {/* Current Password */}
              <div>
                <label htmlFor="currentPassword" className={labelCls}>Current Password</label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Enter your current password"
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword
                      ? <EyeOff className="h-4 w-4" />
                      : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className={labelCls}>New Password</label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword
                      ? <EyeOff className="h-4 w-4" />
                      : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className={labelCls}>Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter new password"
                  className={inputCls}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className={btnGhost}>Cancel</button>
                <button type="submit" className={btnPrimary}>
                  <Lock className="h-4 w-4" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>

          {/* Two-Factor Authentication card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Add an extra layer of security to your account
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="flex-shrink-0 inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Enable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB: NOTIFICATIONS                                                   */}
      {/* ================================================================== */}
      {activeTab === 'notifications' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4 mb-6">
            Notification Preferences
          </h3>
          <div className="space-y-8">

            {/* Email Notifications */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Email Notifications
              </h4>
              <div className="space-y-4">
                {([
                  {
                    label: 'Project updates',
                    description: 'Get notified about project changes and milestones',
                    key: 'projectUpdate' as const,
                  },
                  {
                    label: 'Task assignments',
                    description: 'Receive emails when tasks are assigned to you',
                    key: 'taskAssigned' as const,
                  },
                  {
                    label: 'Team invitations',
                    description: 'Get notified when someone invites you to join a team',
                    key: 'projectInvite' as const,
                  },
                ] as const).map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start justify-between gap-4 cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={user.notificationPreferences?.[item.key] ?? false}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-600 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Push Notifications */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Push Notifications
              </h4>
              <div className="space-y-4">
                {([
                  {
                    label: 'Mentions and comments',
                    description: 'When someone mentions you or comments on your work',
                    key: 'commentMention' as const,
                  },
                  {
                    label: 'Due date reminders',
                    description: 'Reminders for upcoming task and project deadlines',
                    key: 'taskDueSoon' as const,
                  },
                ] as const).map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start justify-between gap-4 cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={user.notificationPreferences?.[item.key] ?? false}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-600 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button type="button" className={btnGhost}>Cancel</button>
              <button type="button" className={btnPrimary}>
                <Save className="h-4 w-4" />
                <span>Save Preferences</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
