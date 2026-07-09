import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from './theme';
import { getPillars, getLogs, getPillarStreak, todayKey, getNotes, saveDayNote } from './storage';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HEAT_COLORS = ['transparent', '#C5E8EA', '#6ECDD4', '#0FA4AF'];

const getHeatLevel = (count, maxPillars) => {
  if (count === 0 || maxPillars === 0) return 0;
  const ratio = count / maxPillars;
  if (ratio <= 0.33) return 1;
  if (ratio <= 0.66) return 2;
  return 3;
};

const formatDateLabel = (year, month, day) => {
  const d = new Date(year, month, day);
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${day}`;
};

export default function DashboardScreen() {
  const [pillars, setPillars] = useState([]);
  const [logs, setLogs] = useState({});
  const [notes, setNotes] = useState({});

  // Notes modal state
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteDate, setNoteDate] = useState('');
  const [noteDateLabel, setNoteDateLabel] = useState('');
  const [noteText, setNoteText] = useState('');

  const loadData = useCallback(async () => {
    try {
      const allPillars = await getPillars();
      const allLogs = await getLogs();
      const allNotes = await getNotes();
      setPillars(allPillars);
      setLogs(allLogs);
      setNotes(allNotes);
    } catch (e) {
      console.log('DashboardScreen loadData error:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const mondayBasedFirst = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const calendarCells = [];
  for (let i = 0; i < mondayBasedFirst; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayLog = logs[dateKey] || [];
    const level = getHeatLevel(dayLog.length, pillars.length);
    const hasNote = !!(notes[dateKey] && notes[dateKey].length > 0);
    calendarCells.push({ day: d, level, isToday: d === today, isFuture: d > today, dateKey, hasNote });
  }

  const totalSessions = Object.values(logs).reduce((sum, dayLog) => sum + dayLog.length, 0);
  const totalMinutes = totalSessions * 8;
  const topStreak = pillars.reduce((max, p) => {
    const s = getPillarStreak(logs, p.id);
    return s > max ? s : max;
  }, 0);
  const daysLoggedThisMonth = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter((d) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return (logs[key] || []).length > 0;
  }).length;

  const handleCellPress = (cell) => {
    if (!cell || cell.isFuture) return;
    setNoteDate(cell.dateKey);
    setNoteDateLabel(formatDateLabel(year, month, cell.day));
    setNoteText(notes[cell.dateKey] || '');
    setNoteModalVisible(true);
  };

  const handleSaveNote = async () => {
    await saveDayNote(noteDate, noteText);
    setNoteModalVisible(false);
    await loadData();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Your investment in progress</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{totalMinutes}</Text>
            <Text style={styles.statLabel}>minutes invested</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: colors.coral }]}>{topStreak}</Text>
            <Text style={styles.statLabel}>best streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: colors.green }]}>{daysLoggedThisMonth}</Text>
            <Text style={styles.statLabel}>days this month</Text>
          </View>
        </View>

        {/* Calendar Heatmap */}
        <View style={styles.calendarCard}>
          <Text style={styles.calendarTitle}>{MONTH_LABELS[month]} {year}</Text>
          <Text style={styles.calendarHint}>Tap a date to add a note</Text>
          <View style={styles.dayHeaders}>
            {DAY_LABELS.map((d) => (
              <Text key={d} style={styles.dayHeader}>{d}</Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {calendarCells.map((cell, i) => {
              if (!cell) return <View key={`e-${i}`} style={styles.calCell} />;
              const bgColor = cell.isFuture ? 'transparent' : HEAT_COLORS[cell.level];
              const isHighHeat = cell.level >= 2;
              const numColor = cell.isFuture
                ? '#CCCAC2'
                : isHighHeat
                ? colors.white
                : colors.textPrimary;
              return (
                <TouchableOpacity
                  key={cell.day}
                  style={[
                    styles.calCell,
                    { backgroundColor: bgColor },
                    cell.isToday && styles.calCellToday,
                  ]}
                  activeOpacity={cell.isFuture ? 1 : 0.6}
                  onPress={() => handleCellPress(cell)}
                >
                  <Text style={[styles.calCellText, { color: numColor }]}>{cell.day}</Text>
                  {cell.hasNote && (
                    <View style={styles.noteDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Pillar Streaks */}
        {pillars.length > 0 && (
          <View style={styles.pillarStreaksCard}>
            <Text style={styles.pillarStreaksTitle}>Pillar streaks</Text>
            {pillars.map((p, idx) => {
              const s = getPillarStreak(logs, p.id);
              return (
                <View
                  key={p.id}
                  style={[styles.pillarStreakRow, idx === pillars.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <Text style={styles.pillarStreakName}>{p.name}</Text>
                  <View style={styles.pillarStreakBadge}>
                    <Text style={styles.pillarStreakNum}>{s}</Text>
                    <Text style={styles.pillarStreakLabel}> days</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Notes Modal */}
      <Modal
        visible={noteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{noteDateLabel}</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Add a note for this day..."
              placeholderTextColor="#A9A8A2"
              value={noteText}
              onChangeText={(t) => {
                if (t.length <= 100) setNoteText(t);
              }}
              multiline
              maxLength={100}
              autoFocus
            />
            <Text style={styles.charCount}>{noteText.length}/100</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setNoteModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveNote}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { flex: 1 },
  content: { paddingBottom: 32 },
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: 10,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.sand,
    borderRadius: radius.card,
    padding: 14,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.teal,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  calendarCard: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.sand,
    borderRadius: radius.card,
    padding: 16,
    marginBottom: spacing.md,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  calendarHint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginVertical: 1,
  },
  calCellToday: {
    borderWidth: 2,
    borderColor: colors.teal,
  },
  calCellText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noteDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.teal,
    position: 'absolute',
    bottom: 3,
  },
  pillarStreaksCard: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.sand,
    borderRadius: radius.card,
    padding: 16,
  },
  pillarStreaksTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  pillarStreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#D5D2CA',
  },
  pillarStreakName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
  },
  pillarStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillarStreakNum: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.coral,
  },
  pillarStreakLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Notes modal
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
    marginBottom: 12,
  },
  noteInput: {
    backgroundColor: colors.sand,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.button,
    backgroundColor: colors.sand,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.button,
    backgroundColor: colors.teal,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
});