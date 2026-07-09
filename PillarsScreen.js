import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from './theme';
import {
  getPillars,
  getLogs,
  togglePillarCompletion,
  getPillarStreak,
  getLast7Days,
  todayKey,
} from './storage';

export default function PillarsScreen({ navigation }) {
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
      console.log('PillarsScreen loadData error:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleToggle = async (pillarId) => {
    try {
      await togglePillarCompletion(pillarId);
      await loadData();
    } catch (e) {
      console.log('Toggle error:', e);
    }
  };

  const handleAddPillar = () => {
    if (pillars.length >= 3) {
      Alert.alert(
        'Pillar limit reached',
        'You already have 3 pillars selected. Remove one in Settings before adding a new one.',
        [{ text: 'OK' }]
      );
    } else {
      navigation.navigate('Settings');
    }
  };

  const isDone = (pillarId) => todayLog.includes(pillarId);

  const getWeeklyPct = (pillarId) => {
    const days = getLast7Days(logs, pillarId);
    if (!days || days.length === 0) return 0;
    const filled = days.filter((d) => d.done).length;
    return Math.round((filled / days.length) * 100);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Pillars</Text>
          <Text style={styles.subtitle}>Tap a pillar to log today's session</Text>
        </View>

        {/* Add Pillar Button */}
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={handleAddPillar}>
          <Text style={styles.addBtnPlus}>+</Text>
          <Text style={styles.addBtnText}>Add a new pillar</Text>
        </TouchableOpacity>

        {/* Section Label */}
        <Text style={styles.sectionLabel}>
          ACTIVE PILLARS ({pillars.length})
        </Text>

        {/* Pillar Cards */}
        {pillars.map((pillar) => {
          const done = isDone(pillar.id);
          const streak = getPillarStreak(logs, pillar.id);
          const last7 = getLast7Days(logs, pillar.id);
          const pct = getWeeklyPct(pillar.id);

          return (
            <TouchableOpacity
              key={pillar.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => handleToggle(pillar.id)}
            >
              {/* Card Header Row */}
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  <View style={[styles.check, done && styles.checkDone]}>
                    {done && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                  <View style={styles.pillarTextBlock}>
                    <Text style={styles.pillarName}>{pillar.name}</Text>
                    <Text style={styles.pillarMeta}>
                      {pillar.category} · {pillar.minutes || 8} min/day
                    </Text>
                  </View>
                </View>

                {/* Streak Badge */}
                <View style={styles.streakBadge}>
                  <Text style={styles.streakCount}>{streak}</Text>
                  <Text style={styles.streakLabel}> day streak</Text>
                </View>
              </View>

              {/* 7-Day Dot Strip */}
              <View style={styles.dotsRow}>
                {last7.map((day, i) => (
                  <View key={i} style={styles.dotCol}>
                    <View
                      style={[
                        styles.dot,
                        day.done && styles.dotDone,
                        !day.done && !day.isFuture && styles.dotMissed,
                      ]}
                    />
                    <Text style={styles.dotLabel}>{day.label}</Text>
                  </View>
                ))}
              </View>

              {/* Progress Bar */}
              <View style={styles.progressRow}>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: pct + '%' }]} />
                </View>
                <Text style={styles.progressPct}>{pct}%</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 24 }} />
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
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 3,
  },
  addBtn: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.teal,
    borderRadius: radius.button,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addBtnPlus: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 24,
  },
  addBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  sectionLabel: {
    paddingHorizontal: spacing.md,
    paddingBottom: 10,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  card: {
    marginHorizontal: spacing.md,
    marginBottom: 12,
    backgroundColor: colors.sand,
    borderRadius: radius.card,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pillarTextBlock: {
    flex: 1,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 99,
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
  checkMark: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  pillarName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pillarMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 99,
    paddingVertical: 4,
    paddingHorizontal: 10,
    flexShrink: 0,
  },
  streakCount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.coral,
  },
  streakLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 10,
  },
  dotCol: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  dot: {
    width: '100%',
    height: 8,
    borderRadius: 99,
    backgroundColor: '#D5D2CA',
  },
  dotDone: {
    backgroundColor: colors.teal,
  },
  dotMissed: {
    backgroundColor: colors.coral,
    opacity: 0.45,
  },
  dotLabel: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  progressBg: {
    flex: 1,
    height: 5,
    backgroundColor: '#D5D2CA',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: colors.green,
  },
  progressPct: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.green,
    width: 32,
    textAlign: 'right',
  },
});