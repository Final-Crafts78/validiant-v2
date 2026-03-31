import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { theme } from '../lib/theme';
import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react-native';
import { syncQueue } from '../lib/sync-queue';

/**
 * Enhanced Offline Connectivity Banner
 *
 * A persistent 32px banner that slides down for:
 * 1. Offline connectivity (Amber)
 * 2. Active sync progress (Blue)
 * 3. Recent sync success (Green)
 *
 * Essential for providing real-time feedback to field workers.
 */
export function OfflineBanner() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [showSuccess, setShowSuccess] = useState(false);

  const slideAnim = useState(new Animated.Value(-100))[0];

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const wasDisconnected = isConnected === false;
      setIsConnected(state.isConnected);

      const shouldShow = !state.isConnected || isSyncing || showSuccess;

      Animated.timing(slideAnim, {
        toValue: shouldShow ? 0 : -100,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Trigger sync if network returns after being disconnected
      if (wasDisconnected && state.isConnected) {
        handleSync();
      }
    });

    return () => unsubscribe();
  }, [slideAnim, isConnected, isSyncing, showSuccess]);

  const handleSync = async () => {
    const total = syncQueue.getQueueLength();
    if (total === 0) return;

    setIsSyncing(true);
    setSyncProgress({ current: 0, total });

    try {
      await syncQueue.processQueue((current, total) => {
        setSyncProgress({ current, total });
      });

      // Show success briefly
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) {
      console.error('[OfflineBanner] Sync error', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Determine banner appearance
  let backgroundColor = theme.colors.amber[400];
  let borderColor = theme.colors.amber[500];
  let textColor = theme.colors.amber[900];
  let icon = <WifiOff size={14} color={textColor} />;
  let label = 'You are currently offline. Actions queued.';

  if (showSuccess) {
    backgroundColor = theme.colors.emerald[500];
    borderColor = theme.colors.emerald[600];
    textColor = theme.colors.white;
    icon = <CheckCircle size={14} color={textColor} />;
    label = 'All data synced successfully!';
  } else if (isSyncing) {
    backgroundColor = theme.colors.primary;
    borderColor = theme.colors.primary;
    textColor = theme.colors.white;
    icon = (
      <RefreshCw
        size={14}
        color={textColor}
        style={{ transform: [{ rotate: '0deg' }] }}
      />
    ); // Simple rotation logic could be added
    label = `Syncing ${syncProgress.current}/${syncProgress.total} items...`;
  } else if (isConnected) {
    // If connected and not syncing/success, hide
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor,
          borderBottomColor: borderColor,
        },
      ]}
    >
      <View style={styles.content}>
        {icon}
        <Text style={[styles.text, { color: textColor }]}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 0,
    left: 0,
    right: 0,
    height: 32,
    justifyContent: 'center',
    zIndex: 9999,
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontSize: 10,
    fontWeight: theme.typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
