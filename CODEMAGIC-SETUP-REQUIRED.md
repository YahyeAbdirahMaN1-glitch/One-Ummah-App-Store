# ⚠️ Codemagic Setup Required Before Next Build

**Current Error:**
```
xcode-project: error: argument --export-options-plist: Path "/Users/builder/export_options.plist" does not exist
```

**Root Cause:** App Store Connect credentials not configured in Codemagic yet.

---

## What You Need to Do (15 Minutes)

### Step 1: Get App Store Connect API Key (10 min)

1. **Go to App Store Connect:** https://appstoreconnect.apple.com
2. **Navigate to:** Users and Access > Integrations > App Store Connect API
3. **Click:** "Generate API Key" (blue + button)
4. **Fill in:**
   - Key Name: `Codemagic One Ummah`
   - Access: `App Manager` (allows TestFlight and App Store uploads)
5. **Click:** Generate
6. **Download the `.p8` file immediately** (can only download once!)
7. **Copy these 3 values:**
   - **Issuer ID** (looks like: `57246542-96fe-1a63-e053-0824d011072a`)
   - **Key ID** (looks like: `2X9R4HXF34`)
   - **Private Key** (the `.p8` file content)

### Step 2: Add Credentials to Codemagic (5 min)

1. **Go to Codemagic:** https://codemagic.io/apps
2. **Select your app:** "One Ummah"
3. **Click:** Environment variables (left sidebar)
4. **Click:** "Add new group"
5. **Create group named:** `app_store_credentials`
6. **Add these 3 variables:**

   **Variable 1:**
   - Name: `APP_STORE_CONNECT_ISSUER_ID`
   - Value: Your Issuer ID (from Step 1)
   - Secure: ✅ YES (check the box)
   - Group: `app_store_credentials`

   **Variable 2:**
   - Name: `APP_STORE_CONNECT_KEY_IDENTIFIER`
   - Value: Your Key ID (from Step 1)
   - Secure: ✅ YES
   - Group: `app_store_credentials`

   **Variable 3:**
   - Name: `APP_STORE_CONNECT_PRIVATE_KEY`
   - Value: Paste the ENTIRE contents of the `.p8` file including the `-----BEGIN PRIVATE KEY-----` header
   - Secure: ✅ YES
   - Group: `app_store_credentials`

7. **Click:** Save

---

## After Setup: Retry Build

Once you've added the credentials:

1. **Go back to:** Codemagic dashboard
2. **Click:** "Start new build"
3. **Select:** `ios-release` workflow
4. **Click:** "Start build"

The build will now:
- ✅ Find App Store Connect credentials
- ✅ Generate export_options.plist automatically
- ✅ Sign the IPA file for App Store distribution
- ✅ Upload to TestFlight automatically

---

## Why This Is Required

Codemagic needs your App Store Connect API key to:
- Automatically sign the app with your developer certificate
- Generate the correct export options for App Store submission
- Upload the IPA file to TestFlight
- Increment build numbers automatically

Without these credentials, Codemagic can't create the `export_options.plist` file, which is why the build failed.

---

## Security Notes

✅ **Safe to use:** App Store Connect API keys are designed for CI/CD services like Codemagic

✅ **Secure storage:** Codemagic encrypts all secure environment variables

✅ **Limited access:** The key only has App Manager permissions (can't access your billing, contracts, etc.)

✅ **Revocable:** You can revoke the key anytime from App Store Connect

❌ **Never commit:** Don't commit the `.p8` file to GitHub or share it publicly

---

## What I Fixed

I also simplified the iOS build command in `codemagic.yaml`:

**Before:**
```yaml
xcode-project build-ipa \
  --project ios/App/App.xcodeproj \
  --scheme App \
  --archive-flags "-destination 'generic/platform=iOS'"
```

**After:**
```yaml
xcode-project build-ipa \
  --project ios/App/App.xcodeproj \
  --scheme App
```

This lets Codemagic handle the export options automatically once credentials are configured.

---

## Screenshot Guide (If Needed)

### App Store Connect API Key Page:
1. Log in to https://appstoreconnect.apple.com
2. Click your name (top right) → Users and Access
3. Click "Integrations" tab at top
4. Click "App Store Connect API" (left sidebar)
5. You'll see "Generate API Key" button

### Codemagic Environment Variables:
1. In Codemagic, select your app
2. Left sidebar → "Environment variables"
3. Click "Add new group"
4. Name it `app_store_credentials`
5. Add the 3 variables with secure checkboxes enabled

---

## Expected Timeline

- **Setup credentials:** 15 minutes (one-time)
- **Retry build:** 2 minutes to start
- **Build duration:** 10-15 minutes
- **TestFlight upload:** Automatic after build succeeds
- **Testing on TestFlight:** 30 minutes
- **App Store submission:** 5 minutes
- **Apple review:** 2-4 days

---

## Next Steps After This

Once the build succeeds:
1. ✅ IPA file will be generated
2. ✅ Uploaded to TestFlight automatically
3. ✅ You'll get email notification
4. ✅ Test the app on your iPhone via TestFlight
5. ✅ Submit for App Store review
6. ⏳ Wait 2-4 days for Apple approval
7. 🎉 App goes live on App Store!

---

**Quick Summary:** Set up App Store Connect API credentials in Codemagic, then retry the build. That's the only thing blocking you now! 🚀
