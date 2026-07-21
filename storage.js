import AsyncStorage from '@react-native-async-storage/async-storage';

const PILLARS_KEY = 'grain:pillars';
const LOGS_KEY = 'grain:logs';
const ONBOARDING_KEY = 'grain:onboarding_complete';
const NOTES_KEY = 'grain:notes';
const ACTIVITY_LOG_KEY = 'grain:activity_logs';

export const DEFAULT_PILLARS = [
  { id: '1', name: 'Build AI Mastery', category: 'AI & Technology', minutes: 8 },
  { id: '2', name: 'Career Asset Build', category: 'Career', minutes: 8 },
  { id: '3', name: 'Body Recharge', category: 'Body & Mind', minutes: 8 },
];

// --- Activity suggestions per pillar category ---
export const PILLAR_ACTIVITIES = {
  'Body & Mind': [
    { emoji: '🏃', label: 'Brisk walk' },
    { emoji: '🧘', label: 'Yoga flow' },
    { emoji: '💪', label: 'HIIT circuit' },
    { emoji: '🕺', label: 'Zumba' },
    { emoji: '🙆', label: 'Stretching' },
    { emoji: '🌬️', label: 'Breathing exercise' },
    { emoji: '🤸', label: 'Full body workout' },
    { emoji: '🥋', label: 'Tai chi' },
    { emoji: '🪷', label: 'Guided meditation' },
    { emoji: '🙏', label: 'Gratitude journaling' },
    { emoji: '🚶', label: 'Phone-free walk' },
    { emoji: '📓', label: 'Journal feelings' },
    { emoji: '💆', label: 'Muscle relaxation' },
    { emoji: '✏️', label: 'Other' },
  ],
  Career: [
    { emoji: '📰', label: 'Read industry article' },
    { emoji: '💼', label: 'Update LinkedIn/resume' },
    { emoji: '🎤', label: 'Practice interview Q' },
    { emoji: '🔧', label: 'Learn a work tool' },
    { emoji: '📁', label: 'Build a career asset' },
    { emoji: '🎥', label: 'Watch skill tutorial' },
    { emoji: '📝', label: 'Write 3 weekly wins' },
    { emoji: '✏️', label: 'Other' },
  ],
  Learning: [
    { emoji: '🗣️', label: 'Language practice' },
    { emoji: '🃏', label: 'Flashcard review' },
    { emoji: '📖', label: 'Read a chapter' },
    { emoji: '🎬', label: 'Watch edu video' },
    { emoji: '💻', label: 'Coding drill' },
    { emoji: '🎧', label: 'Podcast segment' },
    { emoji: '📝', label: 'Summarize learning' },
    { emoji: '✏️', label: 'Other' },
  ],
  Relationships: [
    { emoji: '💬', label: 'Message someone you care about' },
    { emoji: '📞', label: 'Call a family member' },
    { emoji: '💌', label: 'Write appreciation note' },
    { emoji: '🎁', label: 'Plan a small gesture' },
    { emoji: '❓', label: 'Ask a genuine question' },
    { emoji: '📝', label: 'Shared journal entry' },
    { emoji: '✏️', label: 'Other' },
  ],
  Wealth: [
    { emoji: '💰', label: 'Track spending' },
    { emoji: '📈', label: 'Review investments' },
    { emoji: '📚', label: 'Learn about investing' },
    { emoji: '💵', label: 'Increase your income' },
    { emoji: '🎯', label: 'Plan a financial goal' },
    { emoji: '🧾', label: 'Review your budget' },
    { emoji: '🏦', label: 'Build your savings' },
    { emoji: '💡', label: 'Learn a money skill' },
    { emoji: '✏️', label: 'Other' },
  ],
  Leadership: [
    { emoji: '💬', label: 'Give meaningful feedback' },
    { emoji: '🎯', label: "Set today's priorities" },
    { emoji: '🤝', label: 'Coach someone' },
    { emoji: '🧠', label: 'Reflect on a decision' },
    { emoji: '📚', label: 'Learn leadership' },
    { emoji: '🗣️', label: 'Practice a difficult conversation' },
    { emoji: '📝', label: 'Review your team goals' },
    { emoji: '🌟', label: "Recognize someone's work" },
    { emoji: '✏️', label: 'Other' },
  ],
  Writing: [
    { emoji: '✍️', label: 'Free-write 8 min' },
    { emoji: '📓', label: 'Journal entry' },
    { emoji: '✏️', label: 'Edit one paragraph' },
    { emoji: '💡', label: 'Writing prompt' },
    { emoji: '📱', label: 'Draft a social post' },
    { emoji: '📖', label: 'Analyze good writing' },
    { emoji: '🖌️', label: 'Other' },
  ],
  'AI & Technology': [
    { emoji: '🤖', label: 'Explore a new AI tool' },
    { emoji: '💬', label: 'Write AI prompts' },
    { emoji: '⚡', label: 'Automate a task' },
    { emoji: '🛠️', label: 'Build something with AI' },
    { emoji: '🔧', label: 'Learn a no-code tool' },
    { emoji: '💻', label: 'Improve your coding skills' },
    { emoji: '📚', label: 'Learn an AI concept' },
    { emoji: '🚀', label: 'Ship a small improvement' },
    { emoji: '✏️', label: 'Other' },
  ],
  Business: [
    { emoji: '📊', label: 'Review key business metrics' },
    { emoji: '💰', label: 'Improve your offer' },
    { emoji: '✍️', label: 'Create marketing content' },
    { emoji: '🤝', label: 'Reach out to a potential customer' },
    { emoji: '💡', label: 'Validate a business idea' },
    { emoji: '📚', label: 'Study a successful business' },
    { emoji: '🎯', label: "Plan tomorrow's priorities" },
    { emoji: '🛠️', label: 'Build your product' },
    { emoji: '✏️', label: 'Other' },
  ],
  Creative: [
    { emoji: '🎤', label: 'Singing practice' },
    { emoji: '🎨', label: 'Painting/sketching' },
    { emoji: '💃', label: 'Dancing' },
    { emoji: '🧵', label: 'Craft project' },
    { emoji: '🍳', label: 'Creative cooking' },
    { emoji: '📷', label: 'Photography' },
    { emoji: '🎸', label: 'Play an instrument' },
    { emoji: '✂️', label: 'DIY project' },
    { emoji: '🖌️', label: 'Doodle/lettering' },
    { emoji: '🎭', label: 'Improv or acting' },
    { emoji: '✏️', label: 'Other' },
  ],
};

// Get activities for a pillar (by category or pillar name)
export const getActivitiesForPillar = (pillar) => {
  // Try exact category match first
  if (PILLAR_ACTIVITIES[pillar.category]) {
    return PILLAR_ACTIVITIES[pillar.category];
  }
  // Try pillar name match (e.g. 'AI & Technology')
  if (PILLAR_ACTIVITIES[pillar.name]) {
    return PILLAR_ACTIVITIES[pillar.name];
  }
  // Fallback to Career
  return PILLAR_ACTIVITIES['Career'];
};

// --- Date helpers ---
export const todayKey = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const dateKeyOffset = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

// --- Onboarding ---
export const hasCompletedOnboarding = async () => {
  const val = await AsyncStorage.getItem(ONBOARDING_KEY);
  return val === 'true';
};

export const saveOnboardingComplete = async () => {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
};

// --- Pillars ---
export const getPillars = async () => {
  const raw = await AsyncStorage.getItem(PILLARS_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const savePillars = async (pillars) => {
  await AsyncStorage.setItem(PILLARS_KEY, JSON.stringify(pillars));
};

// --- Logs ---
export const getLogs = async () => {
  const raw = await AsyncStorage.getItem(LOGS_KEY);
  return raw ? JSON.parse(raw) : {};
};

export const saveLogs = async (logs) => {
  await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs));
};

// Toggle a pillar's completion for today
export const togglePillarCompletion = async (pillarId, date = todayKey()) => {
  const logs = await getLogs();
  const dayLog = logs[date] || [];

  if (dayLog.includes(pillarId)) {
    logs[date] = dayLog.filter((id) => id !== pillarId);
  } else {
    logs[date] = [...dayLog, pillarId];
  }

  if (logs[date].length === 0) {
    delete logs[date];
  }

  await saveLogs(logs);
  return logs;
};

// --- Activity Logs ---
// Structure: { "2026-07-17": { "pillarId": "Yoga flow", ... }, ... }
export const getActivityLogs = async () => {
  const raw = await AsyncStorage.getItem(ACTIVITY_LOG_KEY);
  return raw ? JSON.parse(raw) : {};
};

export const saveActivityLog = async (pillarId, activityLabel, date = todayKey()) => {
  const actLogs = await getActivityLogs();
  if (!actLogs[date]) {
    actLogs[date] = {};
  }
  actLogs[date][pillarId] = activityLabel;
  await AsyncStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(actLogs));
  return actLogs;
};

export const getActivityForDate = async (pillarId, date = todayKey()) => {
  const actLogs = await getActivityLogs();
  if (actLogs[date] && actLogs[date][pillarId]) {
    return actLogs[date][pillarId];
  }
  return null;
};

// Get all activities for a specific date (for dashboard display)
export const getActivitiesForDate = async (date) => {
  const actLogs = await getActivityLogs();
  return actLogs[date] || {};
};

// --- Day Notes ---
export const getNotes = async () => {
  const raw = await AsyncStorage.getItem(NOTES_KEY);
  return raw ? JSON.parse(raw) : {};
};

export const getDayNote = async (date) => {
  const notes = await getNotes();
  return notes[date] || '';
};

export const saveDayNote = async (date, text) => {
  const notes = await getNotes();
  if (text.trim()) {
    notes[date] = text.trim();
  } else {
    delete notes[date];
  }
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
};

// --- Streak calculations ---

export const getOverallStreak = (logs) => {
  let streak = 0;
  let offset = 0;

  if (!logs[todayKey()] || logs[todayKey()].length === 0) {
    offset = -1;
  }

  while (true) {
    const key = dateKeyOffset(offset);
    const dayLog = logs[key];
    if (dayLog && dayLog.length > 0) {
      streak++;
      offset--;
    } else {
      break;
    }
  }
  return streak;
};

export const getPillarStreak = (logs, pillarId) => {
  let streak = 0;
  let offset = 0;

  const todayLog = logs[todayKey()] || [];
  if (!todayLog.includes(pillarId)) {
    offset = -1;
  }

  while (true) {
    const key = dateKeyOffset(offset);
    const dayLog = logs[key] || [];
    if (dayLog.includes(pillarId)) {
      streak++;
      offset--;
    } else {
      break;
    }
  }
  return streak;
};

// Returns Mon-Sun for the current week with done/missed/future status
export const getLast7Days = (logs, pillarId) => {
  const today = new Date();
  const currentDay = today.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    const key = d.toISOString().slice(0, 10);
    const isFuture = d > today;
    const dayLog = logs[key] || [];
    const done = dayLog.includes(pillarId);

    days.push({
      key,
      label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      done,
      isFuture,
    });
  }
  return days;
};

// --- Dashboard helpers ---

export const getHeatmapData = (logs) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const heatmap = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const count = (logs[key] || []).length;
    heatmap.push({ date: key, day, count });
  }
  return heatmap;
};

export const getStats = (logs, pillars, days) => {
  let sessionsDone = 0;
  let sessionsTotal = 0;
  const totalPillars = pillars.length;

  for (let i = 0; i < days; i++) {
    const key = dateKeyOffset(-i);
    const dayLog = logs[key] || [];
    sessionsDone += dayLog.length;
    sessionsTotal += totalPillars;
  }

  const totalMinutes = sessionsDone * 8;
  const consistency = sessionsTotal > 0
    ? Math.round((sessionsDone / sessionsTotal) * 100) : 0;

  return { sessionsDone, sessionsTotal, totalMinutes, consistency };
};

export const getPillarBreakdown = (logs, pillars, days) => {
  return pillars.map((pillar) => {
    let count = 0;
    for (let i = 0; i < days; i++) {
      const key = dateKeyOffset(-i);
      if ((logs[key] || []).includes(pillar.id)) count += 1;
    }
    return {
      ...pillar,
      sessionsDone: count,
      minutesTotal: count * pillar.minutes,
      progress: days > 0 ? count / days : 0,
    };
  });
};