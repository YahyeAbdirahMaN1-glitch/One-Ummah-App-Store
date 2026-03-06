#!/bin/bash
# Download high-quality Adhan recordings

ADHAN_DIR="public/adhans"
mkdir -p "$ADHAN_DIR"

echo "Downloading high-quality Adhan recordings..."

# Mishary Rashid Alafasy (Kuwait) - Most popular
wget -q --show-progress -O "$ADHAN_DIR/mishary-alafasy.mp3" \
  "https://www.islamcan.com/audio/adhan/adhan-makkah-fajr.mp3" || \
  echo "Failed to download Mishary Alafasy"

# Abdul Basit (Egypt)
wget -q --show-progress -O "$ADHAN_DIR/abdul-basit.mp3" \
  "https://download.quranicaudio.com/quran/abdulbaset_mujawwad/adhan.mp3" || \
  echo "Failed to download Abdul Basit"

echo "Download complete!"
ls -lh "$ADHAN_DIR"
