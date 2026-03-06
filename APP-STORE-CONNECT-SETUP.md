# App Store Connect Setup Required

## Error: "Validation failed - Failed to publish to App Store Connect"

This means the app needs to be created in App Store Connect BEFORE Codemagic can upload builds.

---

## Step-by-Step Fix:

### 1. Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com/
2. Click "My Apps"
3. Click the "+" button → "New App"
4. Fill in:
   - **Platform:** iOS
   - **Name:** One Ummah (or "Ummah Unity")
   - **Primary Language:** English
   - **Bundle ID:** Select `com.oneummah.app` (must match exactly!)
   - **SKU:** `one-ummah-001` (any unique identifier)
   - **User Access:** Full Access

5. Click "Create"

---

### 2. Fill Required App Information

#### App Information Tab:
- **Privacy Policy URL:** (REQUIRED - see below if you don't have one)
- **Category:** Social Networking
- **Secondary Category:** (optional) Lifestyle
- **Content Rights:** Does not contain third-party content

#### Pricing and Availability:
- **Price:** Free
- **Availability:** All countries (or select specific ones)

---

### 3. App Privacy

Click "App Privacy" and answer:
- **Does your app collect data?** Yes
  - Account information (username, email)
  - Photos/Videos (user-generated content)
  - Location (for friend suggestions, prayer times)
  - User content (posts, messages)

Mark all as:
- Used for **App Functionality**
- Used for **Product Personalization**
- **Not** used for tracking
- **Not** linked to user identity for some features

---

### 4. Export Compliance

When uploading first build, you'll be asked:
- **Does your app use encryption?** NO
  (Unless you added custom encryption - we're using standard HTTPS which doesn't count)

If asked again:
- Select "No" for custom encryption
- Standard HTTPS encryption is exempt

---

### 5. Privacy Policy URL (If You Don't Have One)

**Quick Solution - Create Simple Privacy Policy:**

You can use a free service:
- https://www.privacypolicygenerator.info/
- https://www.freeprivacypolicy.com/

Or host a simple one on GitHub Pages:

1. Create file: `privacy-policy.html`
2. Upload to GitHub repository
3. Enable GitHub Pages in settings
4. Use URL: `https://yourusername.github.io/privacy-policy.html`

**Or use Adaptive:**
- Upload privacy policy to `/home/computer/storage/privacy-policy.html`
- Access via: `https://yahyeabdirahman1526404989.adaptive.ai/cdn/privacy-policy.html`

---

### 6. Version Information

For first TestFlight upload:
- **Version:** 1.0
- **Build:** (automatically set by Codemagic using timestamp)
- **Copyright:** 2026 One Ummah
- **What's New:** "Initial release of One Ummah - Islamic social network"

---

### 7. Screenshots (Can Add Later)

**Required sizes for App Store:**
- 6.7" (iPhone 15 Pro Max): 1290 x 2796
- 6.5" (iPhone 14 Plus): 1284 x 2778
- 5.5" (iPhone 8 Plus): 1242 x 2208

**For TestFlight:** Screenshots NOT required! You can add them later before App Store submission.

---

## After Setup in App Store Connect:

### Trigger New Codemagic Build:

**Option 1: Automatic (Recommended)**
Just push any small change to GitHub:
```bash
cd /home/computer/one-ummah
git commit --allow-empty -m "Trigger build after App Store Connect setup"
git push origin main
```

**Option 2: Manual**
1. Go to Codemagic
2. Select "One Ummah" app
3. Click "Start new build"
4. Select `main` branch
5. Select `ios-release` workflow
6. Click "Start build"

---

## Expected Timeline:

1. **Create app in App Store Connect:** 10-15 minutes
2. **Codemagic build:** 15-20 minutes
3. **TestFlight processing:** 5-10 minutes
4. **Ready to test:** ~30-45 minutes total

---

## Troubleshooting:

### If build still fails:

**Check Codemagic logs for:**
- Missing certificates
- Wrong Bundle ID
- API key issues

**Common fixes:**
1. Verify Bundle ID matches exactly: `com.oneummah.app`
2. Ensure App Store Connect API key is valid
3. Check app was created in App Store Connect
4. Verify you accepted latest Apple agreements

---

## Quick Privacy Policy Template:

If you need a quick privacy policy, here's a minimal one:

```
ONE UMMAH PRIVACY POLICY

Last Updated: March 6, 2026

One Ummah ("we", "our", "us") operates the One Ummah mobile application.

INFORMATION WE COLLECT:
- Account information (username, email, password)
- Profile information (name, profile picture, bio)
- User-generated content (posts, comments, photos, videos)
- Location data (for friend suggestions and prayer times)
- Usage data (app interactions, features used)

HOW WE USE YOUR INFORMATION:
- To provide and maintain our service
- To enable social features (posts, messaging, friends)
- To provide prayer times for your location
- To suggest nearby Muslims and potential friends
- To improve our app and user experience

DATA SHARING:
- We do not sell your personal information
- Your posts and profile are visible to other users
- We may share data with service providers (hosting, analytics)

YOUR RIGHTS:
- You can delete your account at any time
- You can request a copy of your data
- You can opt out of location services

CONTACT US:
support@oneummah.app

By using One Ummah, you agree to this Privacy Policy.
```

Save this as a webpage and host it, then add the URL to App Store Connect.

---

## Status Checklist:

Before retrying build:
- [ ] App created in App Store Connect
- [ ] Bundle ID matches: `com.oneummah.app`
- [ ] Privacy Policy URL added
- [ ] App category selected
- [ ] Pricing set (Free)
- [ ] Export compliance answered (No encryption)
- [ ] Ready to trigger new build!

---

**Once App Store Connect is set up, Codemagic builds will succeed and upload to TestFlight automatically!**
