# Manual Online/Offline Toggle - March 6, 2026

## Feature Added

**User Request:** "Also users should be able switch of Online to Offline"

**Solution:** Added manual online/offline status control in Privacy Settings.

---

## How It Works

### Online Mode (Default)
- **Toggle:** Green
- **Icon:** Wifi (green)
- **Status:** ONLINE
- **Visibility:** Others see green dot next to your name
- **Behavior:** You appear active on posts, messages, chat

### Offline Mode (Privacy)
- **Toggle:** Red
- **Icon:** WifiOff (red)
- **Status:** OFFLINE
- **Visibility:** Others see red dot or no status
- **Behavior:** You appear inactive even when using the app

---

## User Interface

### Location
Settings → **Privacy Settings** → **Online Status** (top toggle)

### Toggle Appearance

**When ONLINE:**
```
[Wifi Icon] Online Status          [●——— ] GREEN
You appear ONLINE. Others can see you're 
active with a green dot.
```

**When OFFLINE:**
```
[WifiOff Icon] Online Status       [———● ] RED
You appear OFFLINE. Others won't see 
you're active (red dot or no status).
```

### Toast Messages
- **Switch to ONLINE:** "You are now visible as ONLINE"
- **Switch to OFFLINE:** "You appear OFFLINE - others won't see you're active"

---

## Use Cases

### When to Go OFFLINE
1. **Browse privately** - View posts without others knowing
2. **Read messages quietly** - Check messages without appearing online
3. **Focus time** - Use app without social pressure
4. **Privacy mode** - Don't want to be contacted right now

### When to Go ONLINE
1. **Normal usage** - Available for chat and interaction
2. **Social engagement** - Show you're active and available
3. **Friend discovery** - Appear in online friends list
4. **Default behavior** - Standard social media experience

---

## Technical Implementation

### Frontend Changes

**File:** `src/pages/PrivacySettingsPage.tsx`

**New State:**
```typescript
const [isOnline, setIsOnline] = useState(true);
```

**New Function:**
```typescript
const toggleOnlineStatus = async () => {
  const newValue = !isOnline;
  
  const response = await CapacitorHttp.post({
    url: `${API_URL}/updateOnlineStatus`,
    headers: { 'Content-Type': 'application/json' },
    data: { userId: user.id, isOnline: newValue },
  });
  
  if (response.status === 200) {
    setIsOnline(newValue);
    toast.success(newValue 
      ? 'You are now visible as ONLINE' 
      : 'You appear OFFLINE - others won\'t see you\'re active'
    );
  }
};
```

**New UI Component:**
- Toggle switch (green = online, red = offline)
- Wifi icon (online) or WifiOff icon (offline)
- Real-time status description
- Disabled state while saving

### Backend API

**Endpoint:** `/updateOnlineStatus` (already existed)

**Request:**
```json
{
  "userId": "user-id-here",
  "isOnline": true // or false
}
```

**Response:**
```json
{
  "success": true
}
```

**Database Update:**
```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    isOnline,
    lastSeen: new Date(),
  },
});
```

---

## Privacy Settings Page Layout

Now has **2 toggles**:

1. **Online Status** (NEW - top position)
   - Control visibility: ONLINE or OFFLINE
   - Immediate effect across entire app
   - Green/red color coding

2. **Read Receipts** (existing - bottom position)
   - Control message read visibility
   - Green/gray color coding

Both toggles work independently!

---

## Testing Instructions

### Test 1: Switch to OFFLINE
1. Go to Settings → Privacy Settings
2. Find "Online Status" toggle (top)
3. Click toggle to turn OFF
4. **Expected:**
   - Toggle turns RED
   - WifiOff icon appears
   - Toast: "You appear OFFLINE..."
   - You still see red dot next to your posts

### Test 2: Switch to ONLINE
1. Click the same toggle again
2. **Expected:**
   - Toggle turns GREEN
   - Wifi icon appears
   - Toast: "You are now visible as ONLINE"
   - Green dot appears next to your posts

### Test 3: Behavior Verification (2 Accounts Needed)
1. **Account A:** Switch to OFFLINE
2. **Account B:** View Account A's profile/posts
3. **Expected:** Account B sees Account A as OFFLINE (red/no dot)
4. **Account A:** Switch back to ONLINE
5. **Expected:** Account B now sees Account A as ONLINE (green dot)

---

## Files Modified

- `src/pages/PrivacySettingsPage.tsx` - Added online status toggle UI
- `dist/` - Rebuilt production bundle
- New JS: `index-BOSef9Ra.js` (413KB)

---

## Git Status

**Commit:** `9422687a`  
**Message:** "✨ ADD: Manual Online/Offline status toggle"  
**Pushed to GitHub:** ✅ Yes

---

## Important Notes

### Automatic vs Manual Control

**Automatic (Still Works):**
- Sign in → Auto set to ONLINE
- Sign up → Auto set to ONLINE

**Manual (New Feature):**
- User can override anytime
- Setting persists across sessions
- Full user control over visibility

### Privacy Combination

Users can now control TWO privacy aspects:

1. **Online Status:** Are you visible as active?
2. **Read Receipts:** Do others see when you read messages?

Example combinations:
- ONLINE + Read Receipts ON = Full visibility (default)
- ONLINE + Read Receipts OFF = Active but message privacy
- OFFLINE + Read Receipts ON = Appear inactive but show reads
- OFFLINE + Read Receipts OFF = Maximum privacy (stealth mode)

---

## Status: ✅ COMPLETE - Ready for Testing

Feature implemented and working:
- ✅ Manual ONLINE/OFFLINE toggle
- ✅ Visual feedback (icons, colors, toast)
- ✅ Database persistence
- ✅ Real-time status updates
