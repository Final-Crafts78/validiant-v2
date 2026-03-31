import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../lib/theme';
import {
  Camera,
  MapPin,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react-native';

interface Props {
  value?: string;
  onChange: (uri: string, location: Location.LocationObject) => void;
  requireLiveCapture?: boolean;
}

/**
 * High-Security Photo Capture Field
 *
 * Essential for BGV field operations:
 * - Real-time GPS accuracy display
 * - Restricts background library access if requireLiveCapture is true
 * - Compliance warnings for poor accuracy (>100m)
 */
export function PhotoCaptureField({
  value,
  onChange,
  requireLiveCapture,
}: Props) {
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'GPS access is required for field capture.'
        );
        return;
      }

      // Continuous monitoring of accuracy
      const locationWatcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 1 },
        (loc) => {
          setAccuracy(loc.coords.accuracy);
          setLocation(loc);
        }
      );

      return () => locationWatcher.remove();
    })();
  }, []);

  const handleCapture = async () => {
    if (!accuracy || accuracy > 100) {
      Alert.alert(
        'Low Accuracy',
        `GPS accuracy must be < 100m to capture proof (current: ${accuracy?.toFixed(1) || 'N/A'}m).`
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: true,
      });

      if (!result.canceled && result.assets[0].uri && location) {
        onChange(result.assets[0].uri, location);
      }
    } catch (e) {
      console.error('[PhotoField] Capture error', e);
    } finally {
      setIsLoading(false);
    }
  };

  const isAccuracyGood = accuracy !== null && accuracy <= 100;

  return (
    <View style={styles.container}>
      <View style={styles.accuracyBar}>
        <View style={styles.accuracyIconLabel}>
          <MapPin
            size={12}
            color={
              isAccuracyGood
                ? theme.colors.emerald[600]
                : theme.colors.rose[600]
            }
          />
          <Text
            style={[
              styles.accuracyText,
              {
                color: isAccuracyGood
                  ? theme.colors.emerald[600]
                  : theme.colors.rose[600],
              },
            ]}
          >
            📍 Accuracy: {accuracy ? `${accuracy.toFixed(1)}m` : 'Detecting...'}
          </Text>
        </View>
        {!isAccuracyGood && accuracy !== null && (
          <View style={styles.warningBox}>
            <AlertTriangle size={10} color={theme.colors.rose[600]} />
            <Text style={styles.warningText}>Wait for better accuracy</Text>
          </View>
        )}
      </View>

      {value ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: value }} style={styles.preview} />
          <TouchableOpacity style={styles.retakeButton} onPress={handleCapture}>
            <RefreshCw size={16} color={theme.colors.white} />
            <Text style={styles.retakeText}>Retake Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.captureBox,
            !isAccuracyGood && styles.captureBoxDisabled,
          ]}
          onPress={handleCapture}
          disabled={!isAccuracyGood || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <>
              <Camera
                size={32}
                color={
                  isAccuracyGood
                    ? theme.colors.primary
                    : theme.colors.slate[300]
                }
              />
              <Text
                style={[
                  styles.captureLabel,
                  !isAccuracyGood && { color: theme.colors.slate[400] },
                ]}
              >
                {requireLiveCapture
                  ? 'Take Live Photo (Required)'
                  : 'Tap to Capture Proof'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {requireLiveCapture && (
        <View style={styles.complianceNote}>
          <Shield size={10} color={theme.colors.slate[400]} />
          <Text style={styles.complianceText}>
            Live capture mandated by organization policy.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  accuracyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.slate[50],
    padding: 6,
    borderRadius: 6,
  },
  accuracyIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accuracyText: {
    fontSize: 10,
    fontWeight: theme.typography.weight.bold,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: theme.colors.rose[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  warningText: {
    fontSize: 8,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.rose[600],
    textTransform: 'uppercase',
  },
  captureBox: {
    height: 140,
    backgroundColor: theme.colors.slate[50],
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.slate[200],
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  captureBoxDisabled: {
    borderColor: theme.colors.slate[100],
    opacity: 0.6,
  },
  captureLabel: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.slate[600],
  },
  previewContainer: {
    position: 'relative',
    height: 200,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  retakeButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retakeText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: theme.typography.weight.bold,
  },
  complianceNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  complianceText: {
    fontSize: 10,
    color: theme.colors.slate[400],
    fontWeight: theme.typography.weight.medium,
  },
});
