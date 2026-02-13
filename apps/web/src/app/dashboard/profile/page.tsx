/**
 * Profile Page
 * 
 * User profile and account settings.
 */

'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { format } from '@/lib/utils';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Save,
  Camera,
} from 'lucide-react';

/**
 * Profile Page Component
 */
export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </span>
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
                <Camera className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-600 mt-1">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="badge badge-success">Active</span>
                <span className="text-sm text-gray-500">
                  Member since {format.date(user.createdAt, { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'profile'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'security'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            Security
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'notifications'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            Notifications
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Personal Information
            </h3>
            <form className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="firstName" className="label">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    defaultValue={user.firstName}
                    className="input"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="label">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    defaultValue={user.lastName}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="label">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  defaultValue={user.email}
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="bio" className="label">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  placeholder="Tell us about yourself..."
                  className="input resize-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" className="btn btn-ghost btn-md">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-md">
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Change Password */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Change Password
              </h3>
              <form className="space-y-5">
                <div>
                  <label htmlFor="currentPassword" className="label">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      className="input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="newPassword" className="label">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      className="input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="label">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className="input"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" className="btn btn-ghost btn-md">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-md">
                    <Lock className="h-4 w-4" />
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      Two-Factor Authentication
                    </h3>
                    <p className="text-sm text-gray-600">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                </div>
                <button className="btn btn-outline btn-sm">
                  Enable
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Notification Preferences
            </h3>
            <div className="space-y-6">
              {/* Email Notifications */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">
                  Email Notifications
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Project updates
                      </p>
                      <p className="text-xs text-gray-600">
                        Get notified about project changes and milestones
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Task assignments
                      </p>
                      <p className="text-xs text-gray-600">
                        Receive emails when tasks are assigned to you
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Team invitations
                      </p>
                      <p className="text-xs text-gray-600">
                        Get notified when someone invites you to join a team
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </label>
                </div>
              </div>

              {/* Push Notifications */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">
                  Push Notifications
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Mentions and comments
                      </p>
                      <p className="text-xs text-gray-600">
                        When someone mentions you or comments on your work
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Due date reminders
                      </p>
                      <p className="text-xs text-gray-600">
                        Reminders for upcoming task and project deadlines
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="btn btn-ghost btn-md">
                  Cancel
                </button>
                <button type="button" className="btn btn-primary btn-md">
                  <Save className="h-4 w-4" />
                  <span>Save Preferences</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
