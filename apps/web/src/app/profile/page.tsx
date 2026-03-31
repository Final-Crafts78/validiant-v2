/**
 * Profile Page (Global)
 *
 * User profile and account settings — Phase 8 Corporate Light Theme.
 * Migrated to global /profile route to ensure accessibility without Org context.
 */

'use client';

import { useState, useMemo, useTransition, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import { updateProfileAction } from '@/actions/auth.actions';
import { usersApi, passkeyApi } from '@/lib/api';
import { format } from 'date-fns';
import {
  Shield,
  Lock,
  Save,
  Camera,
  Loader2,
  Fingerprint,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Shared style constants
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
  const [activeTab, setActiveTab] = useState<
    'profile' | 'security' | 'notifications'
  >('profile');
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [passkeyStatus, setPasskeyStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [passkeyMsg, setPasskeyMsg] = useState('');

  // Update form state when user data changes
  useEffect(() => {
    setFirstName(nameComponents.firstName);
    setLastName(nameComponents.lastName);
    setPhoneNumber(user?.phoneNumber || '');
    setBio(user?.bio || '');
  }, [
    user?.fullName,
    user?.bio,
    user?.phoneNumber,
    nameComponents.firstName,
    nameComponents.lastName,
  ]);

  // Get initials from fullName with null-safety
  const initials = useMemo(() => {
    if (!user || !user.fullName) return 'U';
    const parts = user.fullName.trim().split(' ');
    const firstInitial = parts[0]?.charAt(0) || '';
    const lastInitial =
      parts.length > 1 ? parts[parts.length - 1]?.charAt(0) : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }, [user]);

  /**
   * Handle profile form submission
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

        // eslint-disable-next-line no-console
        console.log('[Profile:Update] Submitting profile update:', {
          fullName,
          bio: bio.trim(),
        });

        const result = await updateProfileAction({
          fullName,
          bio: bio.trim() || undefined,
        });

        if (phoneNumber.trim()) {
          try {
            await usersApi.updateProfile({
              fullName,
              phoneNumber: phoneNumber.trim(),
            });
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[Profile:Update] Phone number sync failed:', err);
          }
        }

        if (result.success && result.user) {
          // eslint-disable-next-line no-console
          console.info('[Profile:Update] SUCCESS', { userId: result.user.id });

          const mergedUserData = {
            ...user,
            ...result.user,
            updatedAt: result.user.updatedAt || new Date().toISOString(),
          };

          updateUser(mergedUserData);
          alert('Profile updated successfully!');
        } else {
          // eslint-disable-next-line no-console
          console.error('[Profile:Update] FAILED', result);
          alert(result.message || 'Failed to update profile');
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[Profile:Update] CRITICAL ERROR:', error);
        alert('An unexpected error occurred. Please try again.');
      }
    });
  };

  /**
   * Handle Avatar Upload
   */
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // eslint-disable-next-line no-console
      console.log('[Profile:Avatar] Uploading file...', {
        name: file.name,
        size: file.size,
      });
      const response = await usersApi.uploadAvatar(file);

      if (response.data?.success && response.data.data?.avatarUrl) {
        const newAvatarUrl = response.data.data.avatarUrl;
        // eslint-disable-next-line no-console
        console.info('[Profile:Avatar] Upload SUCCESS', { newAvatarUrl });

        // Update user in store
        if (user) {
          updateUser({ ...user, avatarUrl: newAvatarUrl });
        }
        alert('Profile picture updated!');
      } else {
        throw new Error(response.data?.message || 'Upload failed');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Profile:Avatar] Upload error:', err);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    setFirstName(nameComponents.firstName);
    setLastName(nameComponents.lastName);
    setPhoneNumber(user?.phoneNumber || '');
    setBio(user?.bio || '');
  };

  if (!user) return null;

  const tabs: {
    id: 'profile' | 'security' | 'notifications';
    label: string;
  }[] = [
    { id: 'profile', label: 'Profile Information' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Profile Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Manage your personal presence and security identifiers
          </p>
        </div>
      </div>

      {/* Profile Hero Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-3xl" />

        <div className="flex flex-col md:flex-row items-center md:items-center gap-8 relative z-10">
          {/* Avatar with upload trigger */}
          <div
            className="relative group cursor-pointer"
            onClick={handleAvatarClick}
          >
            <div className="w-28 h-28 rounded-3xl bg-slate-50 flex items-center justify-center border-2 border-slate-100 group-hover:border-blue-200 transition-all shadow-inner overflow-hidden">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-3xl font-black">
                  {initials}
                </div>
              )}

              {/* Overlay for hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                {isUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <>
                    <Camera className="h-6 w-6 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">
                      Change
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {user.fullName}
            </h2>
            <p className="text-slate-500 font-bold text-sm mt-1 mb-4">
              {user.email}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                ACTIVE SESSION
              </span>
              {user.emailVerified && (
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                  VERIFIED IDENTITY
                </span>
              )}
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-1">
                JOINED{' '}
                {format(new Date(user.createdAt), 'MMM yyyy').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white/50 backdrop-blur-sm border border-slate-200 rounded-2xl p-1.5 flex gap-1 sticky top-4 z-20 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="transition-all duration-300">
        {activeTab === 'profile' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Identity Metadata
                </h3>
                <p className="text-xs text-slate-400 font-bold">
                  Manage your core profile visibility
                </p>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleProfileSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className={labelCls}>
                    First Name
                  </label>
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
                  <label htmlFor="lastName" className={labelCls}>
                    Last Name
                  </label>
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

              <div>
                <label htmlFor="email" className={labelCls}>
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={user.email}
                    className={`${inputCls} bg-slate-50 border-dashed cursor-not-allowed`}
                    disabled
                    readOnly
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <Lock className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-2 ml-1">
                  Immutable — contact infrastructure for identity updates
                </p>
              </div>

              <div>
                <label htmlFor="phoneNumber" className={labelCls}>
                  Mobile Connection
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className={inputCls}
                  disabled={isPending}
                />
              </div>

              <div>
                <label htmlFor="bio" className={labelCls}>
                  Professional Summary
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a brief overview of your expertise..."
                  className={`${inputCls} resize-none`}
                  disabled={isPending}
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                <button
                  type="button"
                  className={btnGhost}
                  onClick={handleCancel}
                  disabled={isPending}
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  className={btnPrimary}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>Commit Synchronization</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SECURITY TAB (Simplified for focus) */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Security Credentials
                  </h3>
                  <p className="text-xs text-slate-400 font-bold">
                    Manage authentication and access
                  </p>
                </div>
              </div>

              <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl text-center bg-slate-50/30">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500">
                  Security preferences are managed via Enterprise Auth Tunnel.
                </p>
                <button className="mt-4 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                  Request Access Reset
                </button>
              </div>
            </div>

            {/* Passkey registration from original */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Fingerprint className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      Biometric Passkey
                    </h3>
                    <p className="text-xs text-slate-500 font-bold mt-1">
                      Register FaceID / TouchID for frictionless entry
                    </p>
                    {passkeyStatus === 'success' && (
                      <p className="text-xs text-emerald-600 font-black uppercase tracking-tighter mt-3 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3" />
                        {passkeyMsg}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={passkeyStatus === 'loading'}
                  onClick={async () => {
                    try {
                      setPasskeyStatus('loading');
                      const optionsRes = await passkeyApi.generateOptions();
                      const { startRegistration } =
                        await import('@simplewebauthn/browser');
                      const attResp = await startRegistration(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        optionsRes.data as any
                      );
                      await passkeyApi.verifyRegistration({
                        response: attResp,
                      });
                      setPasskeyStatus('success');
                      setPasskeyMsg('Passkey successfully linked');
                    } catch (err) {
                      setPasskeyStatus('error');
                      setPasskeyMsg('Registration interrupted');
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {passkeyStatus === 'loading' ? 'Encrypting…' : 'Link Device'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB (Simplified) */}
        {activeTab === 'notifications' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Fingerprint className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Signal Preferences
                </h3>
                <p className="text-xs text-slate-400 font-bold">
                  Configure platform communication channels
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {[
                {
                  title: 'Project Telemetry',
                  desc: 'Real-time updates on active workspace milestones',
                },
                {
                  title: 'Collaboration Mentions',
                  desc: 'Direct alerts when team members request participation',
                },
                {
                  title: 'Security Audit Notifications',
                  desc: 'Critical alerts for login attempts and access changes',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-blue-100 transition-colors"
                >
                  <div>
                    <p className="text-sm font-black text-slate-700 tracking-tight">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      {item.desc}
                    </p>
                  </div>
                  <div className="w-12 h-6 bg-slate-100 rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
