import AsyncStorage from '@react-native-async-storage/async-storage';

const PILLARS_KEY = 'grain:pillars';
const LOGS_KEY = 'grain:logs';
const ONBOARDING_KEY = 'grain:onboarding_complete';
const NOTES_KEY = 'grain:notes';

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getPillars = async () => {
  try {
    const val = await AsyncStorage.getItem(PILLARS_KEY);
    return val ? JSON.parse(val) : [];
  } catch (e) {
    return [];
  }
};

export const savePillars = async (pillars) => {
  try {
    await AsyncStorage.setItem(PILLARS_KEY, JSON.stringify(pillars));
  } catch (e) {
    console.log('savePillars error:', e);
  }
};

export const getLogs = async () => {
  try {
    const val = await AsyncStorage.getItem(LOGS_KEY);
    return val ? JSON.parse(val) : {};
  } catch (e) {
    return {};
  }
};

export const saveLogs = async (logs) => {
  try {
    await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.log('saveLogs error:', e);
  }
};

export const togglePillarCompletion = async (pillarId) => {
  try {
    const logs = await getLogs();
    const key = todayKey();
    const dayLog = logs[key] || [];
    if (dayLog.includes(pillarId)) {
      logs[key] = dayLog.filter((id) => id !== pillarId);
    } else {
      logs[key] = [...dayLog, pillarId];
    }
    await saveLogs(logs);
  } catch (e) {
    console.log('togglePillarCompletion error:', e);
  }
};

export const getPillarStreak = (logs, pillarId) => {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayLog = logs[key] || [];
    if (dayLog.includes(pillarId)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
};

export const getLast7Days = (logs, pillarId) => {
  const days = [];
  const today = new Date();
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Find Monday of current week
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayLog = logs[key] || [];
    const isFuture = d > today;
    days.push({
      label: labels[i],
      done: dayLog.includes(pillarId),
      isFuture: isFuture,
    });
  }
  return days;
};

export const saveOnboardingComplete = async () => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (e) {
    console.log('saveOnboardingComplete error:', e);
  }
};

export const hasCompletedOnboarding = async () => {
  try {
    const val = await AsyncStorage.getItem(ONBOARDING_KEY);
    return val === 'true';
  } catch (e) {
    return false;
  }
};

// ═══ Notes (per-date) ═══

export const getNotes = async () => {
  try {
    const val = await AsyncStorage.getItem(NOTES_KEY);
    return val ? JSON.parse(val) : {};
  } catch (e) {
    return {};
  }
};

export const getDayNote = async (dateKey) => {
  try {
    const notes = await getNotes();
    return notes[dateKey] || '';
  } catch (e) {
    return '';
  }
};

export const saveDayNote = async (dateKey, text) => {
  try {
    const notes = await getNotes();
    if (text && text.trim().length > 0) {
      notes[dateKey] = text.trim();
    } else {
      delete notes[dateKey];
    }
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch (e) {
    console.log('saveDayNote error:', e);
  }
};