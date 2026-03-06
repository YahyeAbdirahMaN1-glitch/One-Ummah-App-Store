#!/bin/bash

# Backup existing files
mkdir -p backup
cp *.mp3 backup/ 2>/dev/null

echo "Downloading high-quality Adhan recordings from Islamic audio sources..."

# Mishary Rashid Alafasy (Kuwait) - Most popular worldwide
wget -q --show-progress --timeout=30 -O mishary-alafasy.mp3 \
  "https://server11.mp3quran.net/a_jbr/Adhan/128/001.mp3" || \
  echo "⚠️ Failed: Mishary Alafasy"

# Abdul Basit Abdus Samad (Egypt) - Classic Egyptian style
wget -q --show-progress --timeout=30 -O abdul-basit.mp3 \
  "https://server8.mp3quran.net/basit/Rewayat-Kalaf-A-n-Hamzah/128/001.mp3" || \
  echo "⚠️ Failed: Abdul Basit"

# Ali Ahmed Mulla (Mecca) - Haram Makkah style
wget -q --show-progress --timeout=30 -O ali-ahmed-mulla.mp3 \
  "https://server10.mp3quran.net/ajm/Rewayat-Hafs-A-n-Assem/128/001.mp3" || \
  echo "⚠️ Failed: Ali Ahmed Mulla"

echo "✅ Download complete! Verifying files..."

for file in *.mp3; do
  if [ -f "$file" ]; then
    size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    if [ "$size" -lt 10000 ]; then
      echo "❌ $file is too small ($size bytes) - likely failed"
      # Restore from backup if exists
      [ -f "backup/$file" ] && cp "backup/$file" "$file"
    else
      echo "✅ $file - $size bytes"
    fi
  fi
done

