import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_KEY = 'grain:reminder';
const CHANNEL_ID = 'daily-reminder';
// Bump when the way reminders are scheduled changes, so existing installs
// get their reminder rescheduled on next app open.
const REMINDER_SCHEMA = 2;

const REMINDER_CONTENT = {
  title: 'Your 8 minutes are waiting',
  body: 'Time to invest in yourself. Small grains, massive results.',
  sound: 'default',
};

// How notifications appear when the app is open (SDK 54 field names)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Android: the channel must exist BEFORE asking for permission.
// On Android 13+ the system permission prompt does not appear until a channel exists.
export const ensureChannel = async () => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Daily Reminder',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
  });
};

// Returns { granted: boolean, reason?: string }
export const requestNotificationPermission = async () => {
  if (!Device.isDevice) {
    return { granted: false, reason: 'not_a_device' };
  }
  await ensureChannel();
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return { granted: true };
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted' ? { granted: true } : { granted: false, reason: `permission_${status}` };
};

const readSettings = async () => {
  try {
    const val = await AsyncStorage.getItem(REMINDER_KEY);
    if (val) return JSON.parse(val);
  } catch (e) {
    // fall through to default
  }
  return { enabled: false, hour: 8, minute: 0, notificationId: null, schema: REMINDER_SCHEMA };
};

const writeSettings = async (settings) => {
  await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(settings));
};

// Schedule the daily reminder. Throws if scheduling fails, so callers can show an error.
export const scheduleDailyReminder = async (hour, minute) => {
  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();

  const id = await Notifications.scheduleNotificationAsync({
    content: REMINDER_CONTENT,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });

  await writeSettings({ enabled: true, hour, minute, notificationId: id, schema: REMINDER_SCHEMA });
  return id;
};

export const cancelReminder = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const settings = await readSettings();
  await writeSettings({ ...settings, enabled: false, notificationId: null });
};

export const getReminderSettings = async () => readSettings();

// Called on every app open. If the reminder is meant to be on but Android has
// nothing queued (or it was scheduled by v1.0.0 without a channel), schedule it again.
// Returns 'off' | 'ok' | 'rescheduled' | 'no_permission' | 'error'
export const syncReminderOnLaunch = async () => {
  try {
    const settings = await readSettings();
    if (!settings.enabled) return 'off';

    await ensureChannel();
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return 'no_permission';

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const upToDate = settings.schema === REMINDER_SCHEMA && scheduled.length > 0;
    if (upToDate) return 'ok';

    await scheduleDailyReminder(settings.hour, settings.minute);
    return 'rescheduled';
  } catch (e) {
    console.log('Reminder sync failed:', e?.message);
    return 'error';
  }
};

// ---------- Diagnostics (hidden panel in Settings) ----------

export const sendTestReminder = async (seconds = 60) => {
  await ensureChannel();
  return Notifications.scheduleNotificationAsync({
    content: { ...REMINDER_CONTENT, title: 'Grain test reminder' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      channelId: CHANNEL_ID,
    },
  });
};

export const getReminderDiagnostics = async () => {
  const lines = [];
  try {
    lines.push(`Device: ${Device.manufacturer || '?'} ${Device.modelName || ''} · Android ${Device.osVersion || '?'}`);
    lines.push(`Physical device: ${Device.isDevice ? 'yes' : 'no'}`);

    const perm = await Notifications.getPermissionsAsync();
    lines.push(`Permission: ${perm.status}${perm.canAskAgain === false ? ' (cannot ask again)' : ''}`);

    if (Platform.OS === 'android') {
      const channels = await Notifications.getNotificationChannelsAsync();
      const ours = channels.find((c) => c.id === CHANNEL_ID);
      lines.push(`Channels: ${channels.map((c) => c.id).join(', ') || 'none'}`);
      lines.push(`Reminder channel: ${ours ? `yes (importance ${ours.importance})` : 'MISSING'}`);
    }

    const settings = await readSettings();
    lines.push(`Saved setting: ${settings.enabled ? 'on' : 'off'} at ${formatTime(settings.hour, settings.minute)} (schema ${settings.schema || 1})`);

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    lines.push(`Scheduled with Android: ${scheduled.length}`);
    scheduled.forEach((n, i) => {
      const t = n.trigger || {};
      const when = t.hour !== undefined ? formatTime(t.hour, t.minute) : t.seconds ? `in ${t.seconds}s` : JSON.stringify(t);
      lines.push(`  ${i + 1}. ${n.content?.title || ''} · ${t.type || '?'} · ${when} · channel ${t.channelId || 'none'}`);
    });
  } catch (e) {
    lines.push(`Error: ${e?.message}`);
  }
  return lines.join('\n');
};

export const formatTime = (hour, minute) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMin = String(minute).padStart(2, '0');
  return `${displayHour}:${displayMin} ${period}`;
};
