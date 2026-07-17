import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from './theme';
import {
  getPillars,
  getLogs,
  togglePillarCompletion,
  getOverallStreak,
  getActivitiesForPillar,
  saveActivityLog,
  getActivityLogs,
  todayKey,
} from './storage';
import {
  trackPillarLogged,
  trackPillarUnlogged,
  trackStreakMilestone,
  trackSettingsOpened,
} from './analytics';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function HomeScreen({ navigation }) {
  const [pillars, setPillars] = useState([]);
  const [logs, setLogs] = useState({});
  const [todayLog, setTodayLog] = useState([]);
  const [streak, setStreak] = useState(0);
  const [expandedPillar, setExpandedPillar] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [todayActivities, setTodayActivities] = useState({});

  const loadData = useCallback(async () => {
    try {
      const allPillars = await getPillars();
      const allLogs = await getLogs();
      const dayLog = allLogs[todayKey()] || [];
      const currentStreak = getOverallStreak(allLogs);
      const actLogs = await getActivityLogs();
      const todayActs = actLogs[todayKey()] || {};

      setPillars(allPillars);
      setLogs(allLogs);
      setTodayLog(dayLog);
      setStreak(currentStreak);
      setTodayActivities(todayActs);
    } catch (e) {
      console.log('HomeScreen loadData error:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      // Reset expanded state when screen focuses
      setExpandedPillar(null);
      setSelectedActivity(null);
    }, [loadData])
  );

  const handlePillarTap = (pillar) => {
    const isDone = todayLog.includes(pillar.id);

    if (isDone) {
      // If already done, tapping again undoes it
      handleUndoPillar(pillar.id);
      return;
    }

    // Expand to show activities
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedPillar === pillar.id) {
      setExpandedPillar(null);
      setSelectedActivity(null);
    } else {
      setExpandedPillar(pillar.id);
      setSelectedActivity(null);
    }
  };

  const handleLogWithActivity = async (pillarId) => {
    try {
      // Save the selected activity if one was picked
      if (selectedActivity) {
        await saveActivityLog(pillarId, selectedActivity);
      }
      // Mark pillar as complete
      const updatedLogs = await togglePillarCompletion(pillarId);
      const newStreak = getOverallStreak(updatedLogs);

      trackPillarLogged(pillarId);
      if ([3, 7, 14, 30, 60, 90].includes(newStreak)) {
        trackStreakMilestone(newStreak);
      }

      // Collapse the expanded card
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedPillar(null);
      setSelectedActivity(null);

      await loadData();
    } catch (e) {
      console.log('Log error:', e);
    }
  };

  const handleSkipAndLog = async (pillarId) => {
    try {
      const updatedLogs = await togglePillarCompletion(pillarId);
      const newStreak = getOverallStreak(updatedLogs);

      trackPillarLogged(pillarId);
      if ([3, 7, 14, 30, 60, 90].includes(newStreak)) {
        trackStreakMilestone(newStreak);
      }

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedPillar(null);
      setSelectedActivity(null);

      await loadData();
    } catch (e) {
      console.log('Skip log error:', e);
    }
  };

  const handleUndoPillar = async (pillarId) => {
    try {
      await togglePillarCompletion(pillarId);
      trackPillarUnlogged(pillarId);
      await loadData();
    } catch (e) {
      console.log('Undo error:', e);
    }
  };

  const toggleActivityChip = (label) => {
    setSelectedActivity(selectedActivity === label ? null : label);
  };

  const doneCount = todayLog.length;
  const totalCount = pillars.length;
  const allDone = totalCount > 0 && doneCount >= totalCount;

  const streakLabel = streak === 0 ? 'Start today!' : streak === 1 ? 'Keep going!' : 'On fire!';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.subGreeting}>Ready for your 8 minutes?</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              trackSettingsOpened();
              navigation.navigate('Settings');
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Your daily investment</Text>
              <View style={styles.heroNumberRow}>
                <Text style={styles.heroNumber}>8</Text>
                <Text style={styles.heroUnit}> minutes</Text>
              </View>
              <Text style={styles.heroTagline}>Small grains. Massive results.</Text>
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="time-outline" size={18} color={colors.white} />
              <Text style={styles.heroBadgeText}>PER DAY</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.streakCard]}>
            <Text style={[styles.statNumber, { color: colors.coral }]}>{streak}</Text>
            <Text style={styles.statLabel}>day streak</Text>
            <Text style={styles.statSub}>{streakLabel}</Text>
          </View>
          <View style={[styles.statCard, styles.doneCard]}>
            <Text style={[styles.statNumber, { color: colors.teal }]}>
              {doneCount}/{totalCount}
            </Text>
            <Text style={styles.statLabel}>done today</Text>
          </View>
        </View>

        {/* Today's Pillars */}
        <Text style={styles.sectionTitle}>Today's Pillars</Text>
        <Text style={styles.sectionSub}>Tap a pillar to see ideas & log your session</Text>

        {allDone && (
          <View style={styles.allDoneBanner}>
            <Text style={styles.allDoneIcon}>✅</Text>
            <Text style={styles.allDoneText}>All done for today! Come back tomorrow.</Text>
          </View>
        )}

        {pillars.map((pillar) => {
          const isDone = todayLog.includes(pillar.id);
          const isExpanded = expandedPillar === pillar.id;
          const activities = getActivitiesForPillar(pillar);
          const loggedActivity = todayActivities[pillar.id];

          return (
            <View key={pillar.id}>
              <TouchableOpacity
                style={[
                  styles.pillarCard,
                  isDone && styles.pillarCardDone,
                  isExpanded && styles.pillarCardExpanded,
                ]}
                onPress={() => handlePillarTap(pillar)}
                activeOpacity={0.7}
              >
                {/* Pillar header row */}
                <View style={styles.pillarTop}>
                  <View style={styles.pillarLeft}>
                    <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
                      {isDone && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.pillarInfo}>
                      <Text style={[styles.pillarName, isDone && styles.pillarNameDone]}>
                        {pillar.name}
                      </Text>
                      <Text style={styles.pillarMeta}>
                        {pillar.category} · {pillar.minutes} min/day
                        {loggedActivity ? ` · ${loggedActivity}` : ''}
                      </Text>
                    </View>
                  </View>
                  {isDone ? (
                    <View style={styles.doneBadge}>
                      <Text style={styles.doneBadgeText}>Done</Text>
                    </View>
                  ) : (
                    <Text style={[styles.arrow, isExpanded && styles.arrowExpanded]}>›</Text>
                  )}
                </View>

                {/* Activity suggestions panel (visible when expanded) */}
                {isExpanded && !isDone && (
                  <View style={styles.activityPanel}>
                    <View style={styles.activityDivider} />

                    <View style={styles.activityHeader}>
                      <Ionicons name="bulb-outline" size={14} color={colors.teal} />
                      <Text style={styles.activityHeaderText}>WHAT WILL YOU DO TODAY?</Text>
                    </View>

                    <View style={styles.chipContainer}>
                      {activities.map((act, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.activityChip,
                            selectedActivity === act.label && styles.activityChipSelected,
                          ]}
                          onPress={() => toggleActivityChip(act.label)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.chipEmoji}>{act.emoji}</Text>
                          <Text
                            style={[
                              styles.chipLabel,
                              selectedActivity === act.label && styles.chipLabelSelected,
                            ]}
                          >
                            {act.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={styles.logBtn}
                      onPress={() => handleLogWithActivity(pillar.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.logBtnText}>Log session ✓</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.skipBtn}
                      onPress={() => handleSkipAndLog(pillar.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.skipText}>
                        or <Text style={styles.skipLink}>skip & just log</Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Bottom spacing */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 40,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  greeting: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subGreeting: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Hero
  heroCard: {
    backgroundColor: colors.teal,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  heroNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  heroNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.white,
  },
  heroUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  heroTagline: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 4,
  },
  heroBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 11,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.card,
    padding: spacing.md,
    alignItems: 'center',
  },
  streakCard: {
    backgroundColor: '#FEF0EE',
  },
  doneCard: {
    backgroundColor: '#F0F7E4',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statSub: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },

  // Section
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  sectionSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  // All done banner
  allDoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7E4',
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 8,
  },
  allDoneIcon: {
    fontSize: 18,
  },
  allDoneText: {
    ...typography.body,
    color: colors.green,
    fontWeight: '600',
    flex: 1,
  },

  // Pillar cards
  pillarCard: {
    backgroundColor: colors.sand,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pillarCardDone: {
    backgroundColor: '#F0F7E4',
  },
  pillarCardExpanded: {
    borderColor: colors.teal,
    backgroundColor: colors.white,
  },
  pillarTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.teal,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  checkmark: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  pillarInfo: {
    flex: 1,
  },
  pillarName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  pillarNameDone: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  pillarMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  arrow: {
    fontSize: 22,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  arrowExpanded: {
    color: colors.teal,
    transform: [{ rotate: '90deg' }],
  },
  doneBadge: {
    backgroundColor: '#F0F7E4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  doneBadgeText: {
    ...typography.caption,
    color: colors.green,
    fontWeight: '700',
    fontSize: 12,
  },

  // Activity panel
  activityPanel: {
    marginTop: 14,
  },
  activityDivider: {
    height: 1,
    backgroundColor: colors.sand,
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  activityHeaderText: {
    ...typography.caption,
    color: colors.teal,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },

  // Activity chips
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 164, 175, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 5,
  },
  activityChipSelected: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '500',
    fontSize: 13,
  },
  chipLabelSelected: {
    color: colors.white,
  },

  // Log button
  logBtn: {
    backgroundColor: colors.teal,
    borderRadius: radius.button,
    padding: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  logBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },

  // Skip link
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  skipLink: {
    color: colors.teal,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});