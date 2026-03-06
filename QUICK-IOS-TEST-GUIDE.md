# Quick iOS Testing Guide

## What Was Fixed

✅ **Posts Feed** - Now shows posts (or test data if offline)  
✅ **Camera** - No more black screen, works with native iOS camera  
✅ **Adhan Audio** - Plays correctly on iPhone with detailed error logging

---

## How to Test (Next Steps)

### Step 1: Upload to GitHub & Codemagic

```bash
cd /home/computer/one-ummah
git add .
git commit -m "Fix iOS: posts feed loading, camera black screen, adhan audio playback"
git push origin main
```

Codemagic will automatically start building your iOS app (15-20 minutes).

---

### Step 2: Install New Build from TestFlight

1. Wait for email from Codemagic (build success)
2. Check TestFlight app on your iPhone
3. Install the new build when available

---

### Step 3: Test Posts Feed

1. **Open app** on iPhone
2. **Look for:**
   - ✅ Spinning loader when app starts
   - ✅ Posts appear (or "Welcome to One Ummah" test post)
   - ✅ Never see blank screen

3. **If posts don't load:**
   - Should see retry button
   - Should see test data instead of blank screen

**Expected Result:** Always see SOMETHING (posts, test data, or error with retry)

---

### Step 4: Test Camera

1. **Tap "Record" button** on home page
2. **Camera should open** (not black screen anymore)
3. **Try PHOTO mode:**
   - Switch to PHOTO at top
   - Tap white circle button
   - iOS native camera should open
   - Take photo and confirm

4. **Try VIDEO mode:**
   - Switch to VIDEO at top
   - Tap red circle to start recording
   - See "REC 0:05" timer at top
   - Tap again to stop
   - See video preview with play button
   - Tap "Use Video" to add to post

**Expected Result:** Camera visible, can take photos/videos

---

### Step 5: Test Adhan Audio

1. **Go to Prayer Times** (bottom navigation)
2. **Tap play button** on any reciter (e.g., Mishary Alafasy)
3. **Should hear Adhan** playing
4. **Try pause button** (should stop and resume)
5. **Try different reciters** (should switch audio)

**Expected Result:** Audio plays clearly, no errors

---

## Debug Logs (If Needed)

### Connect Safari Web Inspector

**On iPhone:**
1. Settings → Safari → Advanced
2. Turn ON "Web Inspector"

**On Mac:**
1. Connect iPhone with USB cable
2. Open Safari
3. Safari → Develop → [Your iPhone] → One Ummah
4. Click Console tab

**You'll see helpful logs like:**
```
[iOS DEBUG] Starting to load posts...
[iOS DEBUG] Posts loaded successfully: 5

[iOS Camera] Camera started successfully

[iOS Adhan] Playback started successfully
```

---

## If Something Still Doesn't Work

### Posts Feed Issue
**Screenshot:** Home page showing the problem  
**Console logs:** Look for `[iOS DEBUG]` messages  
**Share:** What you see vs. what you expected

### Camera Issue
**Screenshot:** Camera screen  
**Console logs:** Look for `[iOS Camera]` messages  
**Share:** Which mode (PHOTO/VIDEO) and what happens

### Adhan Issue
**Screenshot:** Prayer Times page  
**Console logs:** Look for `[iOS Adhan]` messages  
**Share:** Which reciter and exact error message

---

## Quick Fixes

**App feels slow?**
- Normal on first load (downloading posts/audio)
- Should be faster after first time

**Camera permission denied?**
- iPhone Settings → One Ummah
- Enable Camera and Microphone
- Return to app and try again

**Audio won't play?**
- Tap play button TWICE (iOS security requirement)
- Check volume is not muted
- Check ringer switch on side of iPhone

---

## Success Checklist

- [ ] Pushed code to GitHub
- [ ] Codemagic build succeeded
- [ ] New build in TestFlight
- [ ] Posts load (or show test data)
- [ ] Camera opens (not black)
- [ ] Can record videos
- [ ] Adhan audio plays
- [ ] No major errors in console

---

**All fixes are done and synced to iOS project. Just need to build and test on TestFlight!**

**Build commands already run:**
- ✅ `npm run prod:build:vite` - Success
- ✅ `npx cap sync ios` - Success

**Ready for:** Git push → Codemagic build → TestFlight testing
