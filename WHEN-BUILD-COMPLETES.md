# ✅ What to Do When Codemagic Build Completes

**Build Status:** Waiting for build to complete (~15-20 minutes from 12:25 PM)

---

## Step 1: Download IPA from Codemagic (5 minutes)

1. **Check your email** for "Build succeeded" notification from Codemagic
2. **Click the link** in the email, or go to https://codemagic.io/apps
3. **Find the latest build** (should be at the top)
4. **Click "Artifacts"** tab
5. **Download the .ipa file** (will be named something like `One-Ummah-App.ipa`)
6. **Save to your Mac** (Desktop or Downloads folder)

---

## Step 2: Upload to App Store Connect via Transporter (10 minutes)

### First Time Setup (if you don't have Transporter):
1. **Open App Store** on your Mac
2. **Search "Transporter"** (free app by Apple)
3. **Download and install**
4. **Open Transporter app**
5. **Sign in** with your Apple Developer account

### Upload Process:
1. **Open Transporter app**
2. **Drag and drop the .ipa file** into the Transporter window
3. **Click "Deliver"** button
4. **Wait for upload** (2-5 minutes depending on internet speed)
5. **See "Delivered successfully"** message

---

## Step 3: Wait for TestFlight Processing (5-10 minutes)

1. **Open App Store Connect** in browser: https://appstoreconnect.apple.com
2. **Go to:** My Apps → One Ummah → TestFlight tab
3. **You'll see:** "Processing" status (yellow icon)
4. **Wait for:** "Ready to Test" status (green checkmark)
5. **Refresh page** every few minutes to check

---

## Step 4: Install on iPhone via TestFlight (5 minutes)

1. **Open TestFlight app** on your iPhone
2. **Find "One Ummah"** in your apps list
3. **Tap "Install"** (or "Update" if you had previous version)
4. **Wait for download** (~50-100 MB)
5. **Tap "Open"** to launch the app

---

## Step 5: Test Key Features (15 minutes)

### Authentication:
- [ ] Sign up with new account works
- [ ] Sign in with existing account works

### Posts:
- [ ] Create text post (appears in feed)
- [ ] Like/comment on posts works

### Camera:
- [ ] Camera button opens camera (gold design visible)
- [ ] Stop button is centered (not off to side)
- [ ] Record Littles video (30 sec, 9:16 aspect)
- [ ] Record Length video (60 sec, 16:9 aspect)
- [ ] Flip camera works (front/back toggle)
- [ ] Post video under 10MB works
- [ ] Video over 10MB shows error message

### Prayer Times:
- [ ] "Use My Location" button works
- [ ] Shows your city/country after location detection
- [ ] Displays 5 prayer times correctly
- [ ] Notification toggle asks for permission
- [ ] (Wait 5 min before a prayer time to test notification)

### Messages:
- [ ] Can send/receive messages
- [ ] Unread count updates

### Profile:
- [ ] Online/offline toggle works
- [ ] Profile picture upload works

---

## If Everything Works ✅

**You're ready for App Store submission!**

Next steps:
1. Add app screenshots (use iPhone Screenshot tool)
2. Fill in App Store description
3. Submit for Apple review
4. Wait 2-4 days for approval
5. App goes live on App Store! 🎉

---

## If Something Doesn't Work ❌

**Don't panic!** We can debug:

1. **Connect iPhone to Mac** via USB cable
2. **Open Safari** on Mac
3. **Go to:** Develop → [Your iPhone] → One Ummah
4. **Open Console** to see error messages
5. **Take screenshot** of errors
6. **Share with me** and we'll fix it

---

## Common Issues & Quick Fixes

**"Sign in doesn't work"**
- Check if you have internet connection
- Try creating new account instead

**"Camera shows black screen"**
- Close app completely (swipe up)
- Reopen app and try again
- Check Settings → One Ummah → Camera permission is ON

**"Prayer times don't show"**
- Check Settings → One Ummah → Location permission is ON
- Try tapping "Use My Location" again

**"Videos won't post"**
- Video might be over 10MB (should show error)
- Try recording shorter video (15-20 seconds)

**"Notifications don't work"**
- Check Settings → One Ummah → Notifications are ON
- Make sure you tapped "Allow" when app asked for permission

---

## Timeline Summary

| Time | Step | Duration |
|------|------|----------|
| Now | Codemagic building | 15-20 min |
| ~12:45 PM | Download IPA | 5 min |
| ~12:50 PM | Upload via Transporter | 10 min |
| ~1:00 PM | TestFlight processing | 5-10 min |
| ~1:10 PM | Install on iPhone | 5 min |
| ~1:15 PM | Test features | 15 min |
| **~1:30 PM** | **DONE!** | **Total: ~1 hour** |

---

**Current Status:** Waiting for Codemagic build email (should arrive ~12:40-12:45 PM)

**Next Action:** Check email in 15-20 minutes, then follow Step 1 above.
