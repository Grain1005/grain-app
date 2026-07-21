import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const MIXPANEL_TOKEN = 'dfb3c45b75ed6d691e56d7ada0be2966';
const MIXPANEL_URL = 'https://api-eu.mixpanel.com/track';
const APP_VERSION = '1.0.0';
const DISTINCT_ID_KEY = 'grain:distinct_id';

let cachedDistinctId = null;

const generateUUID = () => {
  return (
    'grain-' +
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).substring(2, 11)
  );
};

const getDistinctId = async () => {
  if (cachedDistinctId) return cachedDistinctId;
  try {
    let id = await AsyncStorage.getItem(DISTINCT_ID_KEY);
    if (!id) {
      id = generateUUID();
      await AsyncStorage.setItem(DISTINCT_ID_KEY, id);
    }
    cachedDistinctId = id;
    return id;
  } catch (e) {
    cachedDistinctId = 'grain-anon-' + Date.now();
    return cachedDistinctId;
  }
};

// React Native safe base64 encoder (no btoa dependency)
const toBase64 = (str) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  while (i < str.length) {
    const chr1 = str.charCodeAt(i++);
    const chr2 = str.charCodeAt(i++);
    const chr3 = str.charCodeAt(i++);
    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    const enc3 = isNaN(chr2) ? 64 : ((chr2 & 15) << 2) | (chr3 >> 6);
    const enc4 = isNaN(chr3) ? 64 : chr3 & 63;
    output +=
      chars.charAt(enc1) +
      chars.charAt(enc2) +
      chars.charAt(enc3) +
      chars.charAt(enc4);
  }
  return output;
};

const track = async (eventName, properties) => {
  try {
    const distinctId = await getDistinctId();
    const props = properties || {};
    const data = {
      event: eventName,
      properties: {
        token: MIXPANEL_TOKEN,
        distinct_id: distinctId,
        time: Math.floor(Date.now() / 1000),
        platform: Platform.OS,
        app_version: APP_VERSION,
        ...props,
      },
    };

    const jsonStr = JSON.stringify(data);
    const base64Data = toBase64(jsonStr);

    const response = await fetch(MIXPANEL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(base64Data)}&verbose=1`,
    });

    const responseText = await response.text();
    console.log('Mixpanel response:', eventName, responseText);

    try {
      const parsed = JSON.parse(responseText);
      if (parsed.status !== 1) {
        console.log('Mixpanel rejected event:', eventName, parsed.error);
      }
    } catch (parseErr) {
      console.log('Mixpanel unexpected response:', responseText);
    }
  } catch (e) {
    console.log('Mixpanel error:', eventName, e.message);
  }
};

export const trackAppOpened = function () { return track('App Opened'); };
export const trackTabViewed = function (tabName) { return track('Tab Viewed', { tab: tabName }); };
export const trackPillarLogged = function (pillarName) { return track('Pillar Logged', { pillar: pillarName }); };
export const trackPillarUnlogged = function (pillarName) { return track('Pillar Unlogged', { pillar: pillarName }); };
export const trackStreakMilestone = function (days) { return track('Streak Milestone', { days: days }); };
export const trackOnboardingStarted = function () { return track('Onboarding Started'); };
export const trackOnboardingCompleted = function () { return track('Onboarding Completed'); };
export const trackPillarSelected = function (pillarName) { return track('Pillar Selected', { pillar: pillarName }); };
export const trackPillarDeselected = function (pillarName) { return track('Pillar Deselected', { pillar: pillarName }); };
export const trackSettingsOpened = function () { return track('Settings Opened'); };
export const trackPillarAdded = function (pillarName) { return track('Pillar Added', { pillar: pillarName }); };
export const trackPillarDeleted = function (pillarName) { return track('Pillar Deleted', { pillar: pillarName }); };
export const trackLogsReset = function () { return track('Logs Reset'); };
export const trackEverythingReset = function () { return track('Everything Reset'); };