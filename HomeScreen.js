import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from './theme';
import {
  getPillars,
  getLogs,
  togglePillarCompletion,
  getPillarStreak,
  todayKey,
} from './storage';
import { trackPillarLogged, trackPillarUnlogged, trackStreakMilestone } from './analytics';

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

  const loadData = useCallback(async () => {
    try {
      const allPillars = await getPillars();
      const allLogs = await getLogs();
      const dayLog = allLogs[todayKey()] || [];
      setPillars(allPillars);
      setLogs(allLogs);
      setTodayLog(dayLog);
    } catch (e) {
      console.log('HomeScreen loadData error:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleToggle = async (pillar) => {
    try {
      const wasDone = todayLog.includes(pillar.id);
      await togglePillarCompletion(pillar.id);
      if (wasDone) {
        trackPillarUnlogged(pillar.name);
      } else {
        trackPillarLogged(pillar.name);
        const newLogs = await getLogs();
        const streak = getPillarStreak(newLogs, pillar.id);
        if ([3, 7, 14, 30, 60, 90].includes(streak)) {
          trackStreakMilestone(streak);
        }
      }
      await loadData();
    } catch (e) {
      console.log('Toggle error:', e);
    }
  };

  const isDone = (pillarId) => todayLog.includes(pillarId);

  const getOverallStreak = () => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayLog = logs[key] || [];
      if (dayLog.length > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  };

  const streak = getOverallStreak();
  const completedCount = pillars.filter((p) => isDone(p.id)).length;
  const totalPillars = pillars.length;
  const allDone = totalPillars > 0 && completedCount === totalPillars;
  const progressPct = totalPillars > 0 ? Math.round((completedCount / totalPillars) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.greetingSub}>Ready for your 8 minutes?</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.settingsBtn}
            hitSlop={8}
          >
            <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Teal 8-minute card */}
        <View style={styles.investCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.investLabel}>Your daily investment</Text>
            <View style={styles.investNumRow}>
              <Text style={styles.investNum}>8</Text>
              <Text style={styles.investUnit}>minutes</Text>
            </View>
            <Text style={styles.investTagline}>Small grains. Massive results.</Text>
          </View>
          <View style={styles.investRight}>
            <View style={styles.investIconCircle}>
              <Ionicons name="time-outline" size={22} color={colors.white} />
            </View>
            <Text style={styles.investPerDay}>PER DAY</Text>
          </View>
        </View>

        {/* Streak + Progress row */}
        <View style={styles.statsRow}>
          {/* Streak card */}
          <View style={styles.streakCard}>
            <Text style={styles.streakNum}>{streak}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.streakTitle}>day streak</Text>
              <Text style={styles.streakSub}>{streak > 0 ? 'Keep going!' : 'Start today!'}</Text>
            </View>
            <Ionicons name="flame" size={20} color={colors.coral} />
          </View>

          {/* Progress card */}
          <View style={styles.progressCard}>
            <Text style={styles.progressNum}>
              {completedCount}/{totalPillars}
            </Text>
            <Text style={styles.progressTitle}>done today</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
            </View>
          </View>
        </View>

        {/* Section */}
        <Text style={styles.sectionTitle}>Today's Pillars</Text>
        <Text style={styles.sectionSub}>Tap to log your session</Text>

        {pillars.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="layers-outline" size={40} color={colors.sand} />
            <Text style={styles.emptyTitle}>No pillars yet</Text>
            <Text style={styles.emptySub}>Go to Settings to add your first pillar.</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyBtnText}>Add pillars</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {allDone && (
              <View style={styles.allDoneBanner}>
                <Ionicons name="checkmark-circle" size={18} color={colors.green} />
                <Text style={styles.allDoneText}>All done for today! Come back tomorrow.</Text>
              </View>
            )}
            {pillars.map((pillar) => {
              const done = isDone(pillar.id);
              return (
                <TouchableOpacity
                  key={pillar.id}
                  style={[styles.pillarCard, done && styles.pillarCardDone]}
                  activeOpacity={0.85}
                  onPress={() => handleToggle(pillar)}
                >
                  <View style={styles.pillarLeft}>
                    <View style={[styles.check, done && styles.checkDone]}>
                      {done && <Ionicons name="checkmark" size={14} color={colors.white} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pillarName, done && styles.pillarNameDone]}>
                        {pillar.name}
                      </Text>
                      <Text style={styles.pillarMeta}>
                        {pillar.category} {'\u00B7'} {pillar.minutes || 8} min/day
                      </Text>
                    </View>
                  </View>
                  {done && (
                    <View style={styles.doneBadge}>
                      <Text style={styles.doneBadgeText}>Done</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { flex: 1 },
  content: { paddingBottom: 32 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  greetingSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingsBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F7F6F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  // Teal investment card
  investCard: {
    marginHorizontal: spacing.md,
    marginBottom: 10,
    backgroundColor: colors.teal,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  investLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  investNumRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  investNum: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.white,
    lineHeight: 40,
    letterSpacing: -1,
  },
  investUnit: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  investTagline: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 3,
  },
  investRight: {
    alignItems: 'center',
    gap: 3,
  },
  investIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  investPerDay: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: 8,
    marginBottom: spacing.md,
  },

  // Streak card
  streakCard: {
    flex: 1,
    backgroundColor: '#FFF5F3',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FFE8E4',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakNum: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.coral,
    lineHeight: 32,
  },
  streakTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  streakSub: {
    fontSize: 9,
    color: colors.textSecondary,
  },

  // Progress card
  progressCard: {
    flex: 1,
    backgroundColor: '#F0FAF0',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#c8e6a8',
    alignItems: 'center',
  },
  progressNum: {
    fontSize: 28,
    fontWeight: '700',
    color: '#5a9a2f',
    lineHeight: 32,
  },
  progressTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2,
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: '#c8e6a8',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#5a9a2f',
    borderRadius: 2,
  },

  // Section
  sectionTitle: {
    paddingHorizontal: spacing.md,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  sectionSub: {
    paddingHorizontal: spacing.md,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  // All done
  allDoneBanner: {
    marginHorizontal: spacing.md,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FAF0',
    borderRadius: radius.button,
    padding: 10,
  },
  allDoneText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.green,
  },

  // Pillar cards
  pillarCard: {
    marginHorizontal: spacing.md,
    marginBottom: 8,
    backgroundColor: colors.sand,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillarCardDone: { opacity: 0.75 },
  pillarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkDone: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  pillarName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pillarNameDone: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  pillarMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  doneBadge: {
    backgroundColor: colors.teal,
    borderRadius: 99,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  doneBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },

  // Empty state
  emptyState: {
    marginHorizontal: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.sand,
    borderRadius: radius.card,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.teal,
    borderRadius: radius.button,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
  },
  emptyBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});