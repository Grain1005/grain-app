import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Share,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius, typography } from './theme';
import { getPillars, savePillars, saveLogs } from './storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  trackSettingsOpened,
  trackPillarAdded,
  trackPillarDeleted,
  trackLogsReset,
  trackEverythingReset,
} from './analytics';
import {
  requestNotificationPermission,
  scheduleDailyReminder,
  cancelReminder,
  getReminderSettings,
  formatTime,
} from './notifications';

const ONBOARDING_KEY = 'grain:onboarding_complete';
const PRIVACY_POLICY_URL = 'https://hyper-bandicoot-d84.notion.site/Grain-Privacy-Policy-f1b5a006f03544ae845ca26dba0061b4';
const FEEDBACK_EMAIL = 'grainapp8@gmail.com';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.grain.app';

const PILLAR_OPTIONS = [
  { id: 'ai',            label: 'AI & Technology', icon: 'hardware-chip-outline',  category: 'Career'        },
  { id: 'career',        label: 'Career',           icon: 'briefcase-outline',      category: 'Career'        },
  { id: 'business',      label: 'Business',         icon: 'trending-up-outline',    category: 'Career'        },
  { id: 'health',        label: 'Health',           icon: 'fitness-outline',        category: 'Health'        },
  { id: 'mindfulness',   label: 'Wellbeing',        icon: 'leaf-outline',           category: 'Wellbeing'     },
  { id: 'learning',      label: 'Learning',         icon: 'book-outline',           category: 'Learning'      },
  { id: 'relationships', label: 'Relationships',    icon: 'people-outline',         category: 'Relationships' },
  { id: 'wealth',        label: 'Wealth',           icon: 'wallet-outline',         category: 'Wealth'        },
  { id: 'leadership',    label: 'Leadership',       icon: 'star-outline',           category: 'Leadership'    },
  { id: 'writing',       label: 'Writing',          icon: 'create-outline',         category: 'Writing'       },
];

const TIME_OPTIONS = [
  { hour: 6, minute: 0 },
  { hour: 7, minute: 0 },
  { hour: 8, minute: 0 },
  { hour: 9, minute: 0 },
  { hour: 10, minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 17, minute: 0 },
  { hour: 18, minute: 0 },
  { hour: 19, minute: 0 },
  { hour: 20, minute: 0 },
  { hour: 21, minute: 0 },
];

export default function SettingsScreen({ navigation }) {
  const [pillars, setPillars] = useState([]);
  const [showPillarPicker, setShowPillarPicker] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(8);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const loadPillars = useCallback(async () => {
    const stored = await getPillars();
    setPillars(stored || []);
    trackSettingsOpened();

    // Load reminder settings
    const reminder = await getReminderSettings();
    if (reminder) {
      setReminderEnabled(reminder.enabled);
      setReminderHour(reminder.hour);
      setReminderMinute(reminder.minute);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPillars();
    }, [loadPillars])
  );

  const handleReminderToggle = async (value) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Permission needed',
          'Please enable notifications in your device settings to get daily reminders.',
          [{ text: 'OK' }]
        );
        return;
      }
      await scheduleDailyReminder(reminderHour, reminderMinute);
      setReminderEnabled(true);
    } else {
      await cancelReminder();
      setReminderEnabled(false);
    }
  };

  const handleTimeSelect = async (hour, minute) => {
    setReminderHour(hour);
    setReminderMinute(minute);
    setShowTimePicker(false);
    if (reminderEnabled) {
      await scheduleDailyReminder(hour, minute);
    }
  };

  const handleRemovePillar = (pillar) => {
    Alert.alert(
      'Remove pillar',
      'This will remove the pillar and its history from your stats.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updated = pillars.filter((p) => p.id !== pillar.id);
            await savePillars(updated);
            setPillars(updated);
            trackPillarDeleted(pillar.name);
          },
        },
      ]
    );
  };

  const handleAddPillar = async (option) => {
    if (pillars.length >= 3) {
      Alert.alert(
        'Pillar limit reached',
        'You already have 3 pillars. Remove one before adding a new one.',
        [{ text: 'OK' }]
      );
      return;
    }
    const alreadyExists = pillars.some((p) => p.name === option.label);
    if (alreadyExists) return;
    const newPillar = {
      id: String(Date.now()),
      name: option.label,
      category: option.category,
      minutes: 8,
    };
    const updated = [...pillars, newPillar];
    await savePillars(updated);
    setPillars(updated);
    setShowPillarPicker(false);
    trackPillarAdded(option.label);
  };

  const handleResetLogs = () => {
    Alert.alert(
      'Reset logs & streaks',
      'This clears all your progress and streaks. Your pillars stay. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await saveLogs({});
            trackLogsReset();
            Alert.alert('Done', 'Your logs and streaks have been cleared.');
          },
        },
      ]
    );
  };

  const handleResetAll = () => {
    Alert.alert(
      'Reset everything',
      'This wipes all your data and restarts onboarding from scratch. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset everything',
          style: 'destructive',
          onPress: async () => {
            await cancelReminder();
            await AsyncStorage.multiRemove([ONBOARDING_KEY, 'grain:pillars', 'grain:logs', 'grain:notes', 'grain:reminder']);
            trackEverythingReset();
            Alert.alert('Done', 'Restart the app to go through onboarding again.');
          },
        },
      ]
    );
  };

  const handleRateGrain = () => {
    Linking.openURL(PLAY_STORE_URL).catch(() =>
      Alert.alert('Coming soon', 'The Play Store listing will be live shortly.')
    );
  };

  const handleShareGrain = async () => {
    try {
      await Share.share({
        message:
          'I\'ve been using Grain to invest 8 minutes a day into things that matter. Check it out!\n\nhttps://play.google.com/store/apps/details?id=com.grain.app',
        title: 'Grain - Small grains. Massive results.',
      });
    } catch (e) {
      console.warn('Share failed:', e);
    }
  };

  const handleSuggestFeature = () => {
    Linking.openURL(
      `mailto:${FEEDBACK_EMAIL}?subject=Grain%20%E2%80%94%20Feature%20Suggestion&body=Hi%20Grain%20team%2C%0A%0AI%20have%20a%20feature%20suggestion%3A%0A%0A`
    );
  };

  const handleReportBug = () => {
    Linking.openURL(
      `mailto:${FEEDBACK_EMAIL}?subject=Grain%20%E2%80%94%20Bug%20Report&body=Hi%20Grain%20team%2C%0A%0AHere%27s%20a%20bug%20I%20found%3A%0A%0A`
    );
  };

  const addablePillars = PILLAR_OPTIONS.filter(
    (o) => !pillars.some((p) => p.name === o.label)
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Pillars section */}
        <Text style={styles.sectionLabel}>My pillars</Text>
        <View style={styles.card}>
          {pillars.length === 0 && (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No pillars yet. Add one below.</Text>
            </View>
          )}
          {pillars.map((pillar) => {
            const option = PILLAR_OPTIONS.find((o) => o.label === pillar.name);
            return (
              <View key={pillar.id} style={styles.pillarRow}>
                <View style={styles.pillarIconWrap}>
                  <Ionicons
                    name={option ? option.icon : 'ellipse-outline'}
                    size={18}
                    color={colors.teal}
                  />
                </View>
                <View style={styles.pillarInfo}>
                  <Text style={styles.pillarName}>{pillar.name}</Text>
                  <Text style={styles.pillarMeta}>{pillar.category} {'\u00B7'} {pillar.minutes} min/day</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemovePillar(pillar)}
                  hitSlop={8}
                  style={styles.removeButton}
                >
                  <Ionicons name="close-circle-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            );
          })}

          {addablePillars.length > 0 && pillars.length < 3 && (
            <TouchableOpacity
              style={styles.addRow}
              onPress={() => setShowPillarPicker((v) => !v)}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.teal} />
              <Text style={styles.addRowText}>Add a pillar</Text>
              <Ionicons
                name={showPillarPicker ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}

          {showPillarPicker && (
            <View style={styles.pickerWrap}>
              {addablePillars.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.pickerRow}
                  onPress={() => handleAddPillar(option)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={option.icon} size={18} color={colors.teal} />
                  <Text style={styles.pickerLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Reminders section */}
        <Text style={styles.sectionLabel}>Reminders</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: '#E8F9FA' }]}>
              <Ionicons name="notifications-outline" size={18} color={colors.teal} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Daily reminder</Text>
              <Text style={styles.rowSub}>Get nudged to do your 8 minutes</Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleReminderToggle}
              trackColor={{ false: '#D5D2CA', true: '#8fd4da' }}
              thumbColor={reminderEnabled ? colors.teal : '#f4f3f0'}
            />
          </View>

          {reminderEnabled && (
            <TouchableOpacity
              style={[styles.row, styles.rowLast]}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.rowIcon, { backgroundColor: '#E8F9FA' }]}>
                <Ionicons name="time-outline" size={18} color={colors.teal} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>Reminder time</Text>
                <Text style={styles.rowSub}>{formatTime(reminderHour, reminderMinute)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Feedback section */}
        <Text style={styles.sectionLabel}>Feedback</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleRateGrain} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: '#FFF9E6' }]}>
              <Ionicons name="star-outline" size={18} color="#D4A017" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Rate Grain</Text>
              <Text style={styles.rowSub}>Enjoying it? Leave us a review</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={handleShareGrain} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: '#E8F9FA' }]}>
              <Ionicons name="share-social-outline" size={18} color={colors.teal} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Share Grain</Text>
              <Text style={styles.rowSub}>Invite a friend to grow with you</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={handleSuggestFeature} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: '#EEF0FF' }]}>
              <Ionicons name="bulb-outline" size={18} color="#5C6BC0" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Suggest a feature</Text>
              <Text style={styles.rowSub}>Tell us what would make Grain better</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, styles.rowLast]} onPress={handleReportBug} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: '#FFF0EE' }]}>
              <Ionicons name="bug-outline" size={18} color={colors.coral} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Report a bug</Text>
              <Text style={styles.rowSub}>Something broken? Let us know</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Data section */}
        <Text style={styles.sectionLabel}>Data</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleResetLogs} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: '#FFF0EE' }]}>
              <Ionicons name="refresh-outline" size={18} color={colors.coral} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, styles.danger]}>Reset logs & streaks</Text>
              <Text style={styles.rowSub}>Keeps your pillars</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, styles.rowLast]} onPress={handleResetAll} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: '#FFF0EE' }]}>
              <Ionicons name="trash-outline" size={18} color={colors.coral} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, styles.danger]}>Reset everything</Text>
              <Text style={styles.rowSub}>Clears all data, restarts onboarding</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* About section */}
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: '#E8F9FA' }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.teal} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Version</Text>
            </View>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>

          <TouchableOpacity
            style={[styles.row, styles.rowLast]}
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
            activeOpacity={0.7}
          >
            <View style={[styles.rowIcon, { backgroundColor: '#E8F9FA' }]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.teal} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Privacy policy</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>Grain {'\u00B7'} Small grains. Massive results.</Text>
        </View>

      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Set reminder time</Text>
            <Text style={styles.modalSub}>When should we nudge you?</Text>
            <ScrollView style={styles.timeList} showsVerticalScrollIndicator={false}>
              {TIME_OPTIONS.map((t) => {
                const isSelected = t.hour === reminderHour && t.minute === reminderMinute;
                return (
                  <TouchableOpacity
                    key={`${t.hour}-${t.minute}`}
                    style={[styles.timeRow, isSelected && styles.timeRowSelected]}
                    onPress={() => handleTimeSelect(t.hour, t.minute)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.timeText, isSelected && styles.timeTextSelected]}>
                      {formatTime(t.hour, t.minute)}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.teal} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowTimePicker(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, backgroundColor: '#F7F6F1' },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEEDE6',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.h2, color: colors.textPrimary },

  sectionLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 0.5,
    borderColor: '#E8E6DE',
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },

  pillarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0EDE4',
    gap: spacing.sm,
  },
  pillarIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarInfo: { flex: 1 },
  pillarName: { ...typography.body, fontWeight: '500', color: colors.textPrimary },
  pillarMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  removeButton: { padding: 4 },

  emptyRow: {
    padding: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0EDE4',
  },
  emptyText: { ...typography.caption, color: colors.textSecondary },

  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
  },
  addRowText: {
    ...typography.body,
    fontWeight: '500',
    color: colors.teal,
    flex: 1,
  },

  pickerWrap: {
    borderTopWidth: 0.5,
    borderTopColor: '#F0EDE4',
    backgroundColor: '#FAFAF8',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0EDE4',
  },
  pickerLabel: { ...typography.body, color: colors.textPrimary },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0EDE4',
    gap: spacing.sm,
  },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: { ...typography.body, fontWeight: '500', color: colors.textPrimary },
  rowSub: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  rowValue: { ...typography.body, color: colors.textSecondary },
  danger: { color: colors.coral },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: spacing.md,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: colors.teal,
  },
  footerText: { ...typography.caption, color: colors.textSecondary },

  // Time picker modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '60%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D5D2CA',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  timeList: {
    maxHeight: 300,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  timeRowSelected: {
    backgroundColor: '#E8F9FA',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  timeTextSelected: {
    fontWeight: '700',
    color: colors.teal,
  },
  modalCloseBtn: {
    marginTop: 12,
    paddingVertical: 13,
    borderRadius: radius.button,
    backgroundColor: colors.sand,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});