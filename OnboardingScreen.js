import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from './theme';
import { savePillars, saveOnboardingComplete } from './storage';
import {
  trackOnboardingStarted,
  trackOnboardingCompleted,
  trackPillarSelected,
  trackPillarDeselected,
} from './analytics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// Brick Pyramid
function BrickPyramid() {
  const rows = [
    { count: 1, color: colors.coral },
    { count: 2, color: colors.warmOrange },
    { count: 3, color: colors.green },
    { count: 4, color: colors.teal },
    { count: 5, color: '#D5D2CA' },
  ];
  return (
    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 2.5 }}>
          {Array.from({ length: row.count }).map((_, ci) => (
            <View
              key={ci}
              style={{
                width: 30,
                height: 15,
                borderRadius: 5,
                backgroundColor: row.color,
                marginHorizontal: 2,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// Progress dots
function ProgressDots({ current, total }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressDot,
            i === current && styles.progressDotActive,
          ]}
        />
      ))}
    </View>
  );
}

export default function OnboardingScreen({ onComplete }) {
  const [screen, setScreen] = useState(0);
  const [selectedPillars, setSelectedPillars] = useState([]);

  const handleStart = () => {
    trackOnboardingStarted();
    setScreen(1);
  };

  const togglePillar = (option) => {
    const alreadySelected = selectedPillars.some((p) => p.id === option.id);
    if (alreadySelected) {
      setSelectedPillars(selectedPillars.filter((p) => p.id !== option.id));
      trackPillarDeselected(option.label);
    } else {
      if (selectedPillars.length >= 3) return;
      setSelectedPillars([...selectedPillars, option]);
      trackPillarSelected(option.label);
    }
  };

  const handleFinish = async () => {
    const pillars = selectedPillars.map((p) => ({
      id: String(Date.now()) + String(Math.random()),
      name: p.label,
      category: p.category,
      minutes: 8,
    }));
    await savePillars(pillars);
    await saveOnboardingComplete();
    trackOnboardingCompleted();
    onComplete();
  };

  // ═══ Screen 0: Philosophy — Brick Pyramid ═══
  if (screen === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.screenTop}>
          <ProgressDots current={0} total={5} />
          <BrickPyramid />
          <Text style={styles.heroTitle}>Build your future.</Text>
          <Text style={styles.heroTitleAccent}>One grain at a time.</Text>
          <Text style={styles.heroSub}>
            Small daily investments compound into the life you want to build.
          </Text>
        </View>
        <View style={styles.btnWrap}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleStart} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Start growing</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ═══ Screen 1: Hook — Hero Numbers ═══
  if (screen === 1) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 0 }} showsVerticalScrollIndicator={false}>
          <ProgressDots current={1} total={5} />

          {/* Big teal hero card */}
          <View style={styles.heroCard}>
            <View style={styles.heroCardTimerIcon}>
              <Ionicons name="time-outline" size={28} color="rgba(255,255,255,0.2)" />
            </View>
            <Text style={styles.heroCardSub}>What if you invested just</Text>
            <Text style={styles.heroCardNum}>8</Text>
            <Text style={styles.heroCardLabel}>minutes a day?</Text>
          </View>

          {/* Arrow */}
          <View style={{ alignItems: 'center', marginVertical: 8 }}>
            <Ionicons name="arrow-down" size={20} color={colors.teal} />
          </View>

          {/* Two stat cards side by side */}
          <View style={styles.statPair}>
            <View style={[styles.statBox, { backgroundColor: '#F0FAF0', borderColor: '#c8e6a8' }]}>
              <Text style={[styles.statBoxNum, { color: '#5a9a2f' }]}>40</Text>
              <Text style={[styles.statBoxLabel, { color: '#5a9a2f' }]}>hours/year</Text>
              <Text style={styles.statBoxSub}>of focused growth</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#FFF0EE', borderColor: '#FFE0D8' }]}>
              <Text style={[styles.statBoxNum, { color: colors.coral }]}>3</Text>
              <Text style={[styles.statBoxLabel, { color: colors.coral }]}>life areas</Text>
              <Text style={styles.statBoxSub}>transformed</Text>
            </View>
          </View>

          {/* Outcomes row */}
          <View style={styles.outcomesCard}>
            <Text style={styles.outcomesTitle}>The compound effect</Text>
            <View style={styles.outcomesRow}>
              <View style={styles.outcomeItem}>
                <View style={styles.outcomeCircle}>
                  <Ionicons name="briefcase-outline" size={18} color={colors.teal} />
                </View>
                <Text style={styles.outcomeLabel}>Career</Text>
              </View>
              <View style={styles.outcomeItem}>
                <View style={styles.outcomeCircle}>
                  <Ionicons name="fitness-outline" size={18} color={colors.teal} />
                </View>
                <Text style={styles.outcomeLabel}>Health</Text>
              </View>
              <View style={styles.outcomeItem}>
                <View style={styles.outcomeCircle}>
                  <Ionicons name="star-outline" size={18} color={colors.teal} />
                </View>
                <Text style={styles.outcomeLabel}>You</Text>
              </View>
            </View>
          </View>

          <Text style={styles.italicLine}>Consistency beats intensity. Every time.</Text>
        </ScrollView>
        <View style={styles.btnWrap}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setScreen(2)} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ═══ Screen 2: Pillar Selection — 2-col grid ═══
  if (screen === 2) {
    return (
      <SafeAreaView style={styles.safe}>
        <ProgressDots current={2} total={5} />
        <View style={styles.pickHeader}>
          <Text style={[styles.heroTitle, { fontSize: 24 }]}>Choose your pillars</Text>
          <Text style={styles.pickSub}>
            Pick up to 3 areas to invest your 8 minutes into each day.
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.pillarGrid} showsVerticalScrollIndicator={false}>
          {PILLAR_OPTIONS.map((option) => {
            const selected = selectedPillars.some((p) => p.id === option.id);
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.pillarCard, selected && styles.pillarCardSelected]}
                onPress={() => togglePillar(option)}
                activeOpacity={0.8}
              >
                <View style={[styles.pillarIconCircle, selected && styles.pillarIconCircleSelected]}>
                  <Ionicons
                    name={option.icon}
                    size={22}
                    color={selected ? colors.white : colors.teal}
                  />
                </View>
                <Text style={[styles.pillarCardLabel, selected && styles.pillarCardLabelSelected]}>
                  {option.label}
                </Text>
                {selected && (
                  <View style={styles.pillarCheck}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.teal} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={styles.btnWrap}>
          <Text style={styles.selectionCount}>{selectedPillars.length}/3 selected</Text>
          <TouchableOpacity
            style={[styles.primaryBtn, selectedPillars.length === 0 && styles.primaryBtnDisabled]}
            onPress={() => selectedPillars.length > 0 && setScreen(3)}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ═══ Screen 3: The Future — Inspired design ═══
  if (screen === 3) {
    const totalHours = selectedPillars.length * 48;
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Gradient top */}
          <View style={styles.futureTop}>
            <ProgressDots current={3} total={5} />
            <View style={styles.futureRocket}>
              <Ionicons name="rocket-outline" size={26} color={colors.teal} />
            </View>
            <Text style={[styles.heroTitle, { fontSize: 24 }]}>The future</Text>
            <Text style={[styles.heroTitleAccent, { fontSize: 24 }]}>you're building</Text>
            <Text style={styles.futureSub}>
              Here's what your daily 8-minute{'\n'}investment adds up to:
            </Text>
          </View>

          {/* Big stat card */}
          <View style={styles.futureStatCard}>
            <View style={styles.futureYearBadge}>
              <Text style={styles.futureYearText}>IN JUST 1 YEAR</Text>
            </View>
            <View style={styles.futureStatRow}>
              {/* Bar chart */}
              <View style={styles.futureBarChart}>
                <View style={[styles.futureBar, { height: 12, backgroundColor: '#C5E8EA' }]} />
                <View style={[styles.futureBar, { height: 22, backgroundColor: '#8fd4da' }]} />
                <View style={[styles.futureBar, { height: 34, backgroundColor: '#4dbfc7' }]} />
                <View style={[styles.futureBar, { height: 48, backgroundColor: colors.teal }]} />
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.futureNum}>{totalHours}</Text>
                <Text style={styles.futureLabel}>hours per year</Text>
                <Text style={styles.futurePillarCount}>
                  across {selectedPillars.length} pillar{selectedPillars.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Pillar breakdown */}
          <View style={styles.futurePillarList}>
            {selectedPillars.map((p) => {
              const opt = PILLAR_OPTIONS.find((o) => o.id === p.id);
              return (
                <View key={p.id} style={styles.futurePillarRow}>
                  <View style={styles.futurePillarIcon}>
                    <Ionicons name={opt ? opt.icon : 'ellipse-outline'} size={16} color={colors.teal} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.futurePillarInvested}>48 hours invested in</Text>
                    <Text style={styles.futurePillarName}>{p.label}</Text>
                  </View>
                  <View style={styles.futurePillarBadge}>
                    <Text style={styles.futurePillarBadgeText}>48h</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
        <View style={styles.btnWrap}>
          <TouchableOpacity style={styles.primaryBtnGrad} onPress={() => setScreen(4)} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Let's build your future</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.taglineBottom}>Small grains. Massive results.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ═══ Screen 4: Commit — Identity statement ═══
  if (screen === 4) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.screenTop}>
          <ProgressDots current={4} total={5} />
          <View style={[styles.commitIcon]}>
            <Ionicons name="heart-outline" size={30} color={colors.coral} />
          </View>
          <Text style={[styles.heroTitle, { marginBottom: spacing.md }]}>Your commitment</Text>

          <View style={styles.identityCard}>
            <Text style={styles.identityQuote}>
              "I am someone who invests in myself every day."
            </Text>
          </View>

          <Text style={styles.commitTagline}>
            Invest 8 intentional minutes today.{'\n'}
            Build the life you'll thank yourself for tomorrow.
          </Text>

          <Text style={styles.recapLabel}>YOUR PILLARS</Text>
          <View style={styles.recapChips}>
            {selectedPillars.map((p) => {
              const opt = PILLAR_OPTIONS.find((o) => o.id === p.id);
              return (
                <View key={p.id} style={styles.recapChip}>
                  <Ionicons name={opt ? opt.icon : 'ellipse-outline'} size={13} color={colors.teal} />
                  <Text style={styles.recapChipText}>{p.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
        <View style={styles.btnWrap}>
          <TouchableOpacity style={styles.primaryBtnGrad} onPress={handleFinish} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Start growing</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },

  // Layout helpers
  screenTop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },

  // Progress dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  progressDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.sand,
  },
  progressDotActive: {
    backgroundColor: colors.teal,
    width: 20,
    borderRadius: 4,
  },

  // Hero text
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 33,
  },
  heroTitleAccent: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.teal,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 33,
    marginBottom: spacing.md,
  },
  heroSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Buttons
  primaryBtn: {
    backgroundColor: colors.teal,
    borderRadius: radius.button,
    paddingVertical: 15,
    alignItems: 'center',
    width: '100%',
  },
  primaryBtnGrad: {
    backgroundColor: colors.teal,
    borderRadius: radius.button,
    paddingVertical: 15,
    alignItems: 'center',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },

  // ═══ Hook screen (Hero Numbers) ═══
  heroCard: {
    backgroundColor: colors.teal,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroCardTimerIcon: {
    position: 'absolute',
    top: 12,
    right: 16,
  },
  heroCardSub: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  heroCardNum: {
    fontSize: 64,
    fontWeight: '700',
    color: colors.white,
    lineHeight: 70,
    letterSpacing: -3,
  },
  heroCardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  statPair: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  statBoxNum: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -1,
  },
  statBoxLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statBoxSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
  },
  outcomesCard: {
    backgroundColor: colors.sand,
    borderRadius: 14,
    padding: 14,
    marginBottom: spacing.md,
  },
  outcomesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  outcomesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  outcomeItem: {
    alignItems: 'center',
  },
  outcomeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  outcomeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  italicLine: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  // ═══ Pillar Selection ═══
  pickHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  pickSub: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  pillarGrid: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pillarCard: {
    width: (SCREEN_WIDTH - spacing.md * 2 - 10) / 2,
    backgroundColor: colors.sand,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pillarCardSelected: {
    borderColor: colors.teal,
    backgroundColor: '#E8F9FA',
  },
  pillarIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  pillarIconCircleSelected: {
    backgroundColor: colors.teal,
  },
  pillarCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  pillarCardLabelSelected: {
    color: colors.teal,
  },
  pillarCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  selectionCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },

  // ═══ Future screen ═══
  futureTop: {
    backgroundColor: '#E8F9FA',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
  futureRocket: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  futureSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  futureStatCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: '#E8F9FA',
    borderRadius: radius.card,
    padding: 16,
    alignItems: 'center',
  },
  futureYearBadge: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#C5E8EA',
    borderRadius: 99,
    paddingVertical: 2,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  futureYearText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.teal,
    letterSpacing: 0.8,
  },
  futureStatRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  futureBarChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 50,
  },
  futureBar: {
    width: 9,
    borderRadius: 3,
  },
  futureNum: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.teal,
    lineHeight: 52,
    letterSpacing: -2,
  },
  futureLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  futurePillarCount: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  futurePillarList: {
    paddingHorizontal: spacing.lg,
    gap: 7,
    marginBottom: spacing.md,
  },
  futurePillarRow: {
    backgroundColor: '#F7F6F1',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  futurePillarIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  futurePillarInvested: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  futurePillarName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  futurePillarBadge: {
    backgroundColor: '#E8F9FA',
    borderRadius: 7,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  futurePillarBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.teal,
  },
  taglineBottom: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },

  // ═══ Commit screen ═══
  commitIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFF0EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  identityCard: {
    backgroundColor: colors.sand,
    borderRadius: radius.card,
    padding: spacing.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  identityQuote: {
    fontSize: 16,
    fontWeight: '600',
    fontStyle: 'italic',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
  },
  commitTagline: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  recapLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  recapChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  recapChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F9FA',
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  recapChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.teal,
  },
});