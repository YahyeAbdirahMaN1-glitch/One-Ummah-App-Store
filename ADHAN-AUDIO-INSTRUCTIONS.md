# Adhan Audio Setup Instructions

## 🕌 Current Issue

The Adhan audio files are currently **placeholder files** and need to be replaced with real Adhan recordings.

## 📍 File Locations

Adhan audio files need to be placed in:
- **Development**: `/home/computer/one-ummah/public/adhans/`
- **Production**: Automatically copied to `dist/adhans/` during build

## 📝 Required Files (8 Reciters)

All files must be **MP3 format** with these exact names:

1. `mishary-alafasy.mp3` - Mishary Rashid Alafasy
2. `abdul-basit.mp3` - Abdul Basit Abdul Samad  
3. `ali-ahmed-mulla.mp3` - Ali Ahmed Mulla
4. `essam-bukhari.mp3` - Essam Bukhari
5. `hafiz-mustafa-ozcan.mp3` - Hafiz Mustafa Ozcan
6. `nasser-alqatami.mp3` - Nasser Al-Qatami
7. `muammar-za.mp3` - Muammar Za
8. `muhammad-siddiq.mp3` - Muhammad Siddiq Al-Minshawi

## 🎵 Where to Get Adhan Audio

### Option 1: YouTube to MP3
1. Search YouTube for: "Adhan [Reciter Name]"
2. Use a YouTube to MP3 converter (e.g., y2mate.com)
3. Download as MP3
4. Rename to match the filenames above
5. Place in `public/adhans/` folder

### Option 2: Islamic Audio Websites
- **IslamCan.com**: https://www.islamcan.com/audio/adhan/
- **Mp3Quran.net**: https://www.mp3quran.net
- **Quranicaudio.com**: https://quranicaudio.com

### Option 3: Use Same Adhan for All Reciters (Quick Fix)
1. Download ONE good Adhan MP3
2. Copy it 8 times with different names:
   ```bash
   cd public/adhans
   cp your-adhan.mp3 mishary-alafasy.mp3
   cp your-adhan.mp3 abdul-basit.mp3
   cp your-adhan.mp3 ali-ahmed-mulla.mp3
   # ... repeat for all 8 files
   ```

## ⚠️ Important Notes

- **File Format**: Must be MP3 (not M4A, WAV, or other formats)
- **File Size**: Recommended 100KB - 1MB per file (1-2 minute Adhan)
- **Quality**: 128kbps or higher recommended
- **Content**: Must be ADHAN (call to prayer), not Quran recitation

## ✅ How to Test

After adding the files:

1. Rebuild the app:
   ```bash
   npm run prod:build:vite
   npx cap sync ios
   ```

2. Open the app and go to **Prayer Times**

3. Click any reciter's **Play button**

4. You should hear the Adhan (not Quran, not silence)

## 🔧 Current Status

- ❌ Adhan files are placeholders (20 bytes each)
- ✅ Player UI is working
- ✅ Play/Pause buttons functional
- ✅ Reciter selection working
- ⏳ **WAITING**: Real Adhan audio files to be added

## 📱 For iOS App Store

Before submitting to App Store:
- ✅ Replace all 8 placeholder files with real Adhan audio
- ✅ Test each reciter plays correctly
- ✅ Verify audio quality is good
- ✅ Ensure files are appropriate length (1-2 minutes)

---

**Need Help?** The Adhan player code is in `src/pages/PrayerTimesPage.tsx` - it's already fully functional and just waiting for real audio files!
