import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_KEY = 'grain:reminder';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request permission
export const requestNotificationPermission = async () => {
  if (!Device.isDevice) {
    console.log('Notifications only work on physical devices');
    return false;
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return false;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-reminder', {
      name: 'Daily Reminder',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  }
  return true;
};

// Schedule daily notification at a specific hour and minute
export const scheduleDailyReminder = async (hour, minute) => {
  // Cancel any existing reminders first
  await cancelReminder();

  const trigger = {
    type: 'daily',
    hour: hour,
    minute: minute,
  };

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your 8 minutes are waiting',
      body: 'Time to invest in yourself. Small grains, massive results.',
      sound: 'default',
    },
    trigger: trigger,
  });

  // Save reminder settings
  await AsyncStorage.setItem(
    REMINDER_KEY,
    JSON.stringify({ enabled: true, hour, minute, notificationId: id })
  );

  return id;
};

// Cancel all scheduled reminders
export const cancelReminder = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const settings = await getReminderSettings();
  if (settings) {
    await AsyncStorage.setItem(
      REMINDER_KEY,
      JSON.stringify({ ...settings, enabled: false, notificationId: null })
    );
  }
};

// Get current reminder settings
export const getReminderSettings = async () => {
  try {
    const val = await AsyncStorage.getItem(REMINDER_KEY);
    if (val) return JSON.parse(val);
    // Default: enabled at 8:00 AM
    return { enabled: false, hour: 8, minute: 0, notificationId: null };
  } catch (e) {
    return { enabled: false, hour: 8, minute: 0, notificationId: null };
  }
};

// Format time for display
export const formatTime = (hour, minute) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMin = String(minute).padStart(2, '0');
  return `${displayHour}:${displayMin} ${period}`;
};