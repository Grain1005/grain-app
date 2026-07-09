const MIXPANEL_TOKEN = 'dfb3c45b75ed6d691e56d7ada0be2966';
const MIXPANEL_URL = 'https://api.mixpanel.com/track';

const track = async (eventName, properties) => {
  try {
    const props = properties || {};
    const data = [
      {
        event: eventName,
        properties: {
          token: MIXPANEL_TOKEN,
          distinct_id: 'grain_user',
          time: Math.floor(Date.now() / 1000),
          ...props,
        },
      },
    ];
    await fetch(MIXPANEL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.log('Mixpanel error:', e);
  }
};

export const trackAppOpened = function() { return track('App Opened'); };
export const trackTabViewed = function(tabName) { return track('Tab Viewed', { tab: tabName }); };
export const trackPillarLogged = function(pillarName) { return track('Pillar Logged', { pillar: pillarName }); };
export const trackPillarUnlogged = function(pillarName) { return track('Pillar Unlogged', { pillar: pillarName }); };
export const trackStreakMilestone = function(days) { return track('Streak Milestone', { days: days }); };
export const trackOnboardingStarted = function() { return track('Onboarding Started'); };
export const trackOnboardingCompleted = function() { return track('Onboarding Completed'); };
export const trackPillarSelected = function(pillarName) { return track('Pillar Selected', { pillar: pillarName }); };
export const trackPillarDeselected = function(pillarName) { return track('Pillar Deselected', { pillar: pillarName }); };
export const trackSettingsOpened = function() { return track('Settings Opened'); };
export const trackPillarAdded = function(pillarName) { return track('Pillar Added', { pillar: pillarName }); };
export const trackPillarDeleted = function(pillarName) { return track('Pillar Deleted', { pillar: pillarName }); };
export const trackLogsReset = function() { return track('Logs Reset'); };
export const trackEverythingReset = function() { return track('Everything Reset'); };