# iOS Debug Testing Guide

## Overview

This build includes comprehensive debug logging to diagnose the "Load Failed" authentication issue on iOS.

---

## Testing Instructions

### 1. Install New Build from TestFlight

1. Wait for Codemagic build to complete (~15-20 minutes)
2. Check TestFlight for new build
3. Install/update the app on your iPhone
4. **DO NOT open the app yet**

### 2. Enable Safari Web Inspector

To see console logs from the iOS app:

1. On your iPhone:
   - Go to **Settings → Safari → Advanced**
   - Enable **Web Inspector**

2. On your Mac:
   - Connect iPhone via USB cable
   - Open **Safari** on your Mac
   - Go to **Develop** menu → **[Your iPhone Name]** → **One Ummah**
   - This opens the Web Inspector showing console logs from the iOS app

### 3. Test Authentication with Logging

**Option A: Sign Up Test**

1. Open the One Ummah app on your iPhone
2. Tap "Sign Up"
3. Fill in the form:
   - **Name:** Test User
   - **Email:** test@example.com
   - **Password:** password123
   - **Confirm Password:** password123
   - **Gender:** Male
4. Keep Safari Web Inspector open on your Mac
5. Tap "Sign Up" button
6. Watch the console logs in Safari Web Inspector

**Option B: Sign In Test** (if you already have an account)

1. Open the app
2. Tap "Sign In"
3. Enter your existing credentials
4. Watch the console logs in Safari Web Inspector

---

## What to Look For in Console Logs

The enhanced logging will show:

### Successful Connection:
```
=== SIGNUP DEBUG ===
API_URL: https://one-ummah-yahyeabdirahman1526404989.on.adaptive.ai/rpc
Signup endpoint: https://one-ummah-yahyeabdirahman1526404989.on.adaptive.ai/rpc/signUp
Email: test@example.com
Name: Test User
Gender: male
User agent: Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)...
Platform: iPhone
Signup response status: 200
Signup successful, userId: abc123...
```

### Network Error:
```
=== SIGNUP ERROR ===
Error name: TypeError
Error message: Failed to fetch
Error stack: ...
Full error object: TypeError: Failed to fetch
```

### Server Error:
```
Signup response status: 500
Error response body: {"error":"Database connection failed"}
```

### CORS Error:
```
Error: Cross-Origin Request Blocked: The Same Origin Policy disallows...
```

---

## Interpreting Results

### If you see "TypeError: Failed to fetch"

**Problem:** iOS cannot reach the server at all

**Possible causes:**
1. NSAppTransportSecurity not applied correctly
2. Server URL is wrong
3. Network connectivity issue
4. Firewall blocking requests

**Next steps:**
- Check if web version works: https://one-ummah-yahyeabdirahman1526404989.on.adaptive.ai
- Try Safari browser on iPhone (not the app) - does signup work?
- Check iPhone has internet connection

### If you see HTTP error (400, 401, 500, etc.)

**Problem:** Request reaches server but server rejects it

**Possible causes:**
1. Backend API validation error
2. CORS headers missing
3. Request format incorrect

**Next steps:**
- Check the error response body in console
- Verify web version has same issue or works fine
- Check if backend API is running

### If you see status 200 but app still shows error

**Problem:** Response parsing issue or unexpected response format

**Next steps:**
- Check what data is in the response
- Verify localStorage is working on iOS
- Check if user object is malformed

### If you see no logs at all

**Problem:** JavaScript not running or Web Inspector not connected

**Next steps:**
- Verify Web Inspector is connected to the right app
- Force quit and reopen the app
- Check if app is loading at all (not white screen)

---

## Common iOS-Specific Issues

### Issue: "Load Failed" with no network request

**Cause:** iOS blocked the request before it was sent

**Solution:**
- Verify Info.plist has NSAppTransportSecurity
- Check if iPhone's "Low Power Mode" is blocking network
- Ensure app has "Cellular Data" permission

### Issue: Request works in Safari but not in app

**Cause:** App Transport Security more strict in WKWebView than Safari

**Solution:**
- May need to add specific domain exceptions to Info.plist
- Verify HTTPS is used (not HTTP)

### Issue: First request fails, second succeeds

**Cause:** iOS "warming up" WKWebView network stack

**Solution:**
- This is normal iOS behavior
- App should retry automatically

---

## Sharing Results

After testing, send me:

1. **Screenshot of console logs** from Safari Web Inspector
2. **What you see on the iPhone screen** (error message or success)
3. **Build number** you're testing (shown in TestFlight)

This information will help me identify the exact cause and fix it.

---

## Quick Diagnostic Questions

Before testing, verify:

- [ ] Is your iPhone connected to internet? (WiFi or cellular)
- [ ] Does the web version work? (https://one-ummah-yahyeabdirahman1526404989.on.adaptive.ai)
- [ ] Is Safari Web Inspector showing console output?
- [ ] Did you install the latest build from TestFlight?

---

## Alternative: Test Without Web Inspector

If you can't use Safari Web Inspector:

1. Open the app
2. Try to sign up/sign in
3. Take screenshots of any error messages
4. Try these variations:
   - Different email address
   - Shorter password
   - Different name
5. Report which variation (if any) worked

---

**Build:** 1741564980 (or newer)  
**Date:** March 5, 2026  
**Changes:** Enhanced debug logging for authentication
