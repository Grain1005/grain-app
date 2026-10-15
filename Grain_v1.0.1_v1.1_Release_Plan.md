# Grain — Next Release Plan (v1.0.1 → v1.1)
As of 12 Oct 2026. Based on GitHub `main` at f5a35b8 (pulled today). In this commit, `notifications.js`, `Settingsscreen.js` and `App.js` are the same as the 20 Aug clone. Only `app.json` changed (package → `com.grain.dailyapp`).

---

## 1. Daily reminder — "never fires"

### What the code does today
- `Settingsscreen.js` toggle → `requestNotificationPermission()` → `scheduleDailyReminder(hour, minute)` with trigger `{ type: 'daily', hour, minute }`.
- The `daily-reminder` channel is created only **after** permission is granted.
- The scheduled notification has **no `channelId`**.
- `app.json` plugins list only `expo-font`, not `expo-notifications`.
- There's no try/catch around scheduling. The app never checks that a reminder actually exists (`getAllScheduledNotificationsAsync`).
- Nothing re-checks the reminder when the app starts.

### Likely causes (ranked; not yet confirmed on a device)
| # | Cause | Why it fits "never fires" | Confidence |
|---|---|---|---|
| 1 | **Android 13+ permission order:** channel created after the permission request | Expo docs: on Android 13+ the OS permission prompt won't show until a channel exists. Permission can stay denied, or the request returns early | High: matches Expo's documented requirement |
| 2 | **No `channelId` on the notification** | Android puts it in a fallback channel, which can be silent or hidden, especially on Samsung | Medium |
| 3 | **Silent failures** | If scheduling throws, the toggle just doesn't flip and nothing is logged. A stored `enabled: true` can show "on" even when nothing is scheduled | Medium |
| 4 | **Samsung battery / "Sleeping apps"** | Inexact alarms get deferred or dropped for apps the user hasn't opened recently | Device-side; only partly fixable in code |
| 5 | `expo-notifications` config plugin missing | Probably not required for local reminders in SDK 54. Add it anyway for icon and colour | Low, to verify |

### Step 1: Diagnose (one dev build, before any fix)
1. Add a hidden **"Send test reminder in 1 minute"** row in Settings (long-press the version label). Use `{ type: 'timeInterval', seconds: 60, channelId: 'daily-reminder' }`.
2. Log `getPermissionsAsync()`, `getNotificationChannelsAsync()` and `getAllScheduledNotificationsAsync()` to the screen, the same way the ErrorBoundary shows errors. That way you can screenshot it.
3. Test on your Samsung, plus one Android 13+ phone if a tester can help. Record: was the prompt shown, was permission granted, was the channel created, was a notification scheduled, did it fire?

### Step 2: Fix (`notifications.js` + `Settingsscreen.js` + `App.js` + `app.json`)
- Create the `daily-reminder` channel **before** asking for permission.
- Add `channelId: 'daily-reminder'` to the trigger. Use `Notifications.SchedulableTriggerInputTypes.DAILY` instead of the string.
- Update the notification handler to `shouldShowBanner` / `shouldShowList` (SDK 54 names). `shouldShowAlert` is deprecated.
- Add try/catch + an Alert + a Mixpanel event `Reminder Failed` (with reason).
- On app start (`App.js`): if the stored setting says enabled but nothing is scheduled, reschedule it.
- Add `"expo-notifications"` to `app.json` plugins (small icon + teal colour).
- Show a one-time tip after enabling the reminder: "On Samsung, set Grain to *Unrestricted* in Battery settings."
- New Mixpanel events: `Reminder Enabled`, `Reminder Time Changed`, `Reminder Failed`.

**Done when:** a fresh install on Android 13+ shows the permission prompt, the test notification arrives within about a minute, and the daily reminder fires two days in a row, including after a phone restart.

---

## 2. v1.0.1 — Fixes release (target: submit before Product Hunt, 17–18 Oct, if the reminder fix is confirmed in time)
| Item | Notes |
|---|---|
| Daily reminder fix | Section 1 |
| Adaptive icon | Rebuild with `icon_v2.png`; keep the wordmark within ~48% safe zone |
| 365-day maths | Onboarding: 8 min/day ≈ 49 h/year per pillar; 3 pillars ≈ 146 h/year |
| Nunito font | `expo-font`, applied app-wide |
| Dark mode | HTML mockup first, then code; add a `theme` property to Mixpanel |
| Version | `app.json` → `1.0.1` (versionCode auto-increments remotely via EAS) |
| Release | Production AAB → Play production track; APK to GitHub Releases as fallback |

Scope risk: dark mode is the biggest item. If time is tight, ship the reminder, icon, maths and Nunito as v1.0.1, and move dark mode to v1.0.2.

---

## 3. v1.1 — Grain Plus (target: submit ~16 Nov)
From the agreed monetisation plan: **$29/year, 7-day free trial**, Google Play Billing via RevenueCat.

**Build order**
1. Billing foundation: `usePlus()` hook, offline cache, restore purchases (EAS dev build needed).
2. Pillar gating: free tier = 3 pillars. Existing users keep their current pillars (`grandfatheredPillarCount`).
3. Paywall: HTML mockup first. Shows when the user tries to add a 4th pillar, export, or opens the monthly report teaser.
4. Export: free CSV; Plus gets Excel (SheetJS) + PDF (expo-print).
5. Monthly report screen.
6. **Founding 100** redemption: 3 months of Plus free. Approach to verify: Play subscription promo codes, or a free-trial offer limited to eligible users.

**Pre-work to start now:** Play payments profile, subscription `grain_plus` / base plan `annual` + trial offer, regional prices (India, Qatar), RevenueCat project + `plus` entitlement, license testers, privacy policy update.

**Events:** Paywall Viewed, Trial Started, Purchase Cancelled, Purchase Restored, Export Created, Monthly Report Viewed, Pillar Limit Hit.

**Done when:** a license tester can start the trial, unlock Plus, cancel, lose access after the trial, and restore after reinstalling.

---

## 4. To verify (not assumed)
- Root cause of the reminder bug: confirm with the Step 1 diagnostic build.
- Whether the `expo-notifications` config plugin is required in SDK 54 for local notifications.
- Founding 100 mechanism (Play promo codes for subscriptions).
- Google's subscription fee (believed 15%) and RevenueCat free-tier limit.
- EAS build quota left this month. v1.0.1 needs about 2–3 builds: diagnostic, release AAB, APK.
