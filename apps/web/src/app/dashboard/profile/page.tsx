/**
 * Profile Page (Global Dashboard Context)
 *
 * User profile and account settings — Phase 8 Corporate Light Theme.
 * Integrated into the Global Dashboard layout.
 */

'use client';

import { useState, useMemo, useTransition, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import { updateProfileAction } from '@/actions/auth.actions';
import { passkeyApi } from '@/lib/api';
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
  RefreshCw,
  User,
} from 'lucide-react';
import { cn } from '@validiant/ui';

// ---------------------------------------------------------------------------
// Shared style constants (Premium Corporate Theme)
// ---------------------------------------------------------------------------
const inputCls =
  'w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm ' +
  'text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 ' +
  'focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-50 dark:disabled:bg-slate-950 ' +
  'disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-200';

const labelCls =
  'block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1';

const btnPrimary =
  'inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold bg-blue-600 ' +
  'text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] ' +
  'disabled:opacity-60 disabled:cursor-not-allowed';

const btnGhost =
  'inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 ' +
  'bg-slate-100 dark:bg-slate-900 border border-transparent rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all ' +
  'active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const fetchUser = useAuthStore((state) => state.fetchUser);

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
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

  // Controlled form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');

  const [passkeyStatus, setPasskeyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [passkeyMsg, setPasskeyMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Initialize form state
  useEffect(() => {
    if (user) {
      setFirstName(nameComponents.firstName);
      setLastName(nameComponents.lastName);
      setDisplayName(user.fullName || '');
      setPhoneNumber(user.phoneNumber || '');
      setBio(user.bio || '');
    }
  }, [user, nameComponents.firstName, nameComponents.lastName]);

  // Get initials
  const initials = useMemo(() => {
    if (!user || !user.fullName) return 'U';
    const parts = user.fullName.trim().split(' ');
    const firstInitial = parts[0]?.charAt(0) || '';
    const lastInitial = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }, [user]);

  /**
   * Handle profile form submission
   */
  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!firstName.trim() || !lastName.trim()) {
      setStatusMsg({ type: 'error', text: 'First and last name are required' });
      return;
    }

    startTransition(async () => {
      try {
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const cleanBio = bio.trim();
        const cleanPhone = phoneNumber.trim();

        // ELITE DEFENSE: Final check to ensure we never send "$undefined" strings
        const bioToSubmit =
          cleanBio === '$undefined' || cleanBio === 'null' || !cleanBio
            ? undefined
            : cleanBio;
        
        const phoneToSubmit = 
          cleanPhone === '$undefined' || cleanPhone === 'null' || !cleanPhone
            ? undefined
            : cleanPhone;

        // Trace logic for debugging profile persistence
        // eslint-disable-next-line no-console
        console.log('[Profile:Update] Initiating synchronization (Trace):', {
          fullName,
          phoneNumber: phoneToSubmit,
          bio: bioToSubmit,
          originalBio: bio,
        });

        const result = await updateProfileAction({
          fullName,
          displayName: displayName.trim() || undefined,
          phoneNumber: phoneToSubmit,
          bio: bioToSubmit,
        });

        if (result.success && result.user) {
          // eslint-disable-next-line no-console
          console.info('[Profile:Update] SUCCESS confirmed by BFF', { userId: result.user.id });
          updateUser(result.user);
          setStatusMsg({
            type: 'success',
            text: 'Profile identity synchronized successfully',
          });

          // Force a store refresh to ensure we have the latest from the server
          await fetchUser();
        } else {
          // eslint-disable-next-line no-console
          console.error('[Profile:Update] REJECTED by BFF', result);
          setStatusMsg({ type: 'error', text: result.message || 'Synchronization failed' });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[Profile:Update] EXCEPTION caught in UI transition', error);
        setStatusMsg({ type: 'error', text: 'Network exception during synchronization' });
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
      // Import dynamically to keep profile page lean
      const { usersApi } = await import('@/lib/api');

      // eslint-disable-next-line no-console
      console.log('[Profile:Avatar] Uploading binary payload...', {
        type: file.type,
        size: file.size,
      });

      const response = await usersApi.uploadAvatar(file);

      if (response.data?.success && response.data.data?.avatarUrl) {
        const newAvatarUrl = response.data.data.avatarUrl;
        if (user) {
          updateUser({ ...user, avatarUrl: newAvatarUrl });
        }
        setStatusMsg({ type: 'success', text: 'Avatar successfully uploaded' });
      } else {
        throw new Error(response.data?.message || 'Upload failed');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Profile:Avatar] UPLOAD CRASH', err);
      setStatusMsg({ type: 'error', text: 'Avatar upload failed' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    if (user) {
      setFirstName(nameComponents.firstName);
      setLastName(nameComponents.lastName);
      setPhoneNumber(user.phoneNumber || '');
      setBio(user.bio || '');
      setStatusMsg(null);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const tabs: {
    id: 'profile' | 'security' | 'notifications';
    label: string;
  }[] = [
    { id: 'profile', label: 'Identity' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header with quick actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Account Console
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Manage your global identity across decentralized workspaces
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.reload()}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-600 transition-colors shadow-sm"
            title="Force synchronization"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Profile Hero Card - Expanded Premium Aesthetic */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-blue-600/10 transition-colors duration-1000" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 rounded-full -ml-32 -mb-32 blur-3xl group-hover:bg-indigo-600/10 transition-colors duration-1000" />

        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="relative group/avatar cursor-pointer" onClick={handleAvatarClick}>
            <div className="w-32 h-32 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center border-4 border-white dark:border-slate-900 group-hover/avatar:border-blue-100 dark:group-hover/avatar:border-blue-900/30 transition-all duration-500 shadow-2xl overflow-hidden">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-4xl font-black italic tracking-tighter">
                  {initials}
                </div>
              )}

              <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-[2px] opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 flex flex-col items-center justify-center text-white">
                {isUploading ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : (
                  <>
                    <Camera className="h-8 w-8 mb-1" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Update
                    </span>
                  </>
                )}
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                {user.fullName}
              </h2>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mt-3">
                <span className="text-slate-400 dark:text-slate-500 font-bold text-sm">
                  {user.email}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 hidden sm:block" />
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                  Joined {format(new Date(user.createdAt), 'MMMM yyyy')}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                <CheckCircle2 className="w-3 h-3" />
                Cloud Verified
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-600/20 text-[10px] font-black uppercase tracking-widest">
                <Shield className="w-3 h-3" />
                Standard Plan
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - Sleek Apple-style pill navigation */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl w-full sm:w-fit mx-auto sm:mx-0 shadow-inner">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300',
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-lg shadow-slate-200/50 dark:shadow-none'
                : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status Notifications */}
      {statusMsg && (
        <div
          className={cn(
            'p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in zoom-in duration-300',
            statusMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
              : 'bg-rose-50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/20 text-rose-700 dark:text-rose-400'
          )}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm font-bold">{statusMsg.text}</span>
        </div>
      )}

      {/* Dynamic Content Area */}
      <div className="grid grid-cols-1 gap-8">
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-10 shadow-sm">
            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-50 dark:border-slate-800/50">
              <div className="p-3 rounded-2xl bg-blue-600/10 dark:bg-blue-600/20 text-blue-600">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Public Profile Identity
                </h3>
                <p className="text-sm font-medium text-slate-400">
                  Visible to members in shared workspaces
                </p>
              </div>
            </div>

            <form className="space-y-8" onSubmit={handleProfileSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
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
                <div className="space-y-2">
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

              <div className="space-y-2">
                <label htmlFor="email" className={labelCls}>
                  System Identifier (Email)
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={user.email}
                    className={cn(
                      inputCls,
                      'bg-slate-50 dark:bg-slate-950/50 border-dashed cursor-not-allowed text-slate-400'
                    )}
                    disabled
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Lock className="w-4 h-4 text-slate-300 dark:text-slate-700" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label htmlFor="phoneNumber" className={labelCls}>
                    Mobile Connectivity
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
                <div className="space-y-2">
                  <label htmlFor="displayName" className={labelCls}>
                    Display Identifier
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Acme Corp Account"
                    className={inputCls}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="bio" className={labelCls}>
                  Professional Metadata
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share your expertise with your workspace teams..."
                  className={cn(inputCls, 'resize-none min-h-[120px]')}
                  disabled={isPending}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-8 border-t border-slate-50 dark:border-slate-800/50">
                <button
                  type="button"
                  className={btnGhost}
                  onClick={handleCancel}
                  disabled={isPending}
                >
                  Reset Defaults
                </button>
                <button type="submit" className={btnPrimary} disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  <span>Synchronize Identity</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-10 shadow-sm">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-50 dark:border-slate-800/50">
                <div className="p-3 rounded-2xl bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    Security Multi-Layer
                  </h3>
                  <p className="text-sm font-medium text-slate-400">
                    Infrastructure-level protective measures
                  </p>
                </div>
              </div>

              <div className="p-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem] text-center bg-slate-50/50 dark:bg-slate-950/20">
                <Lock className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300">
                  Managed Authentication
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 max-w-sm mx-auto">
                  Your core credentials are encrypted and managed via Validiant Auth Gateway for
                  maximum isolation.
                </p>
                <button
                  className={cn(btnGhost, 'mt-6 py-2.5 px-5 bg-white dark:bg-transparent shadow-sm')}
                >
                  Initiate Credential Reset
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-10 shadow-sm overflow-hidden relative">
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 relative z-10">
                <div className="flex items-center sm:items-start gap-5">
                  <div className="p-3 rounded-2xl bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 flex-shrink-0">
                    <Fingerprint className="h-6 w-6" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      Frictionless Passkey
                    </h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                      Link device biometrics for ultra-secure, one-tap entry
                    </p>
                    {passkeyStatus === 'success' && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 mt-4 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 animate-in fade-in slide-in-from-left-2 transition-all">
                        <CheckCircle2 className="w-3 h-3" />
                        {passkeyMsg}
                      </div>
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
                      const { startRegistration } = await import('@simplewebauthn/browser');
                      const attResp = await startRegistration(optionsRes.data as any);
                      await passkeyApi.verifyRegistration({ response: attResp });
                      setPasskeyStatus('success');
                      setPasskeyMsg('Linked Successfully');
                    } catch (err) {
                      setPasskeyStatus('error');
                      setPasskeyMsg('Registration Interrupted');
                      // eslint-disable-next-line no-console
                      console.error('[Passkey:Error]', err);
                    }
                  }}
                  className={cn(
                    btnPrimary,
                    'w-full sm:w-fit bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                  )}
                >
                  {passkeyStatus === 'loading' ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>Link FaceID / TouchID</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
