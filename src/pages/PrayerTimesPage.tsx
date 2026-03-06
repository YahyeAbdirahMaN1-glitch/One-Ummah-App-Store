import { useState, useEffect, useRef } from 'react';
import { Search, Play, Pause, MapPin, Volume2, ArrowLeft, Bell, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { useNotifications } from '../hooks/useNotifications';

interface PrayerTime {
  name: string;
  time: string;
}

interface AdhanReciter {
  id: string;
  name: string;
  location: string;
  country: string;
  region: string;
  audioFile: string;
}

const ADHAN_RECITERS: AdhanReciter[] = [
  {
    id: '1',
    name: 'Mishary Rashid Alafasy',
    location: 'Kuwait City',
    country: 'Kuwait',
    region: 'Gulf',
    audioFile: '/adhans/mishary-alafasy.mp3',
  },
  {
    id: '2',
    name: 'Abdul Basit Abdul Samad',
    location: 'Cairo',
    country: 'Egypt',
    region: 'Middle East',
    audioFile: '/adhans/abdul-basit.mp3',
  },
  {
    id: '3',
    name: 'Ali Ahmed Mulla',
    location: 'Mecca',
    country: 'Saudi Arabia',
    region: 'Hejaz',
    audioFile: '/adhans/ali-ahmed-mulla.mp3',
  },
  {
    id: '4',
    name: 'Essam Bukhari',
    location: 'Medina',
    country: 'Saudi Arabia',
    region: 'Hejaz',
    audioFile: '/adhans/essam-bukhari.mp3',
  },
  {
    id: '5',
    name: 'Nasser Al-Qatami',
    location: 'Riyadh',
    country: 'Saudi Arabia',
    region: 'Najd',
    audioFile: '/adhans/nasser-alqatami.mp3',
  },
  {
    id: '6',
    name: 'Hafiz Mustafa Ozcan',
    location: 'Istanbul',
    country: 'Turkey',
    region: 'Anatolia',
    audioFile: '/adhans/hafiz-mustafa-ozcan.mp3',
  },
  {
    id: '7',
    name: 'Muammar Za',
    location: 'Jakarta',
    country: 'Indonesia',
    region: 'Southeast Asia',
    audioFile: '/adhans/muammar-za.mp3',
  },
  {
    id: '8',
    name: 'Muhammad Siddiq Al-Minshawi',
    location: 'Alexandria',
    country: 'Egypt',
    region: 'North Africa',
    audioFile: '/adhans/muhammad-siddiq.mp3',
  },
];

export default function PrayerTimesPage() {
  const navigate = useNavigate();
  const { permission, requestPermission, sendPrayerNotification } = useNotifications();
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReciter, setSelectedReciter] = useState<string | null>(null);
  const [playingReciter, setPlayingReciter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notificationTimersRef = useRef<NodeJS.Timeout[]>([]);

  const fetchPrayerTimes = async () => {
    if (!city.trim() || !country.trim()) {
      toast.error('Please enter both city and country');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(
          city
        )}&country=${encodeURIComponent(country)}`
      );

      if (!response.ok) throw new Error('Failed to fetch prayer times');

      const data = await response.json();
      const timings = data.data.timings;

      setPrayerTimes([
        { name: 'Fajr', time: timings.Fajr },
        { name: 'Dhuhr', time: timings.Dhuhr },
        { name: 'Asr', time: timings.Asr },
        { name: 'Maghrib', time: timings.Maghrib },
        { name: 'Isha', time: timings.Isha },
      ]);

      toast.success('Prayer times loaded successfully');
    } catch (error) {
      toast.error('Failed to load prayer times');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdhanAudio = async (reciter: AdhanReciter) => {
    try {
      // If currently playing this reciter, pause
      if (playingReciter === reciter.id && audioRef.current) {
        audioRef.current.pause();
        setPlayingReciter(null);
        return;
      }

      // If playing different reciter, stop it first
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Create new audio element with iOS-specific attributes
      const audio = document.createElement('audio');
      audio.setAttribute('playsinline', '');
      audio.setAttribute('webkit-playsinline', '');
      audio.preload = 'auto';
      
      audioRef.current = audio;
      
      // Set source
      audio.src = reciter.audioFile;

      // Setup event handlers
      audio.addEventListener('ended', () => {
        setPlayingReciter(null);
        audioRef.current = null;
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        setPlayingReciter(null);
        audioRef.current = null;
        toast.error('Failed to load Adhan audio. Please check your internet connection.');
      });

      // Try to play
      try {
        setPlayingReciter(reciter.id);
        await audio.play();
        toast.success(`Playing ${reciter.name}`);
      } catch (playError: any) {
        console.error('Play error:', playError);
        setPlayingReciter(null);
        audioRef.current = null;
        
        if (playError.name === 'NotAllowedError') {
          toast.error('Please tap the play button again to start audio (browser security requirement)');
        } else if (playError.name === 'AbortError') {
          toast.error('Playback interrupted. Please try again.');
        } else {
          toast.error('Failed to play Adhan. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Adhan playback error:', error);
      setPlayingReciter(null);
      audioRef.current = null;
      toast.error('An error occurred. Please try again.');
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Clear all notification timers
      notificationTimersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  const schedulePrayerNotifications = () => {
    // Clear existing timers
    notificationTimersRef.current.forEach(timer => clearTimeout(timer));
    notificationTimersRef.current = [];

    if (!notificationsEnabled || prayerTimes.length === 0) return;

    const now = new Date();
    
    prayerTimes.forEach(prayer => {
      // Parse prayer time (format: "HH:MM")
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerDate = new Date();
      prayerDate.setHours(hours, minutes, 0, 0);

      // Calculate milliseconds until prayer time
      let msUntilPrayer = prayerDate.getTime() - now.getTime();

      // If prayer time has passed today, skip it
      if (msUntilPrayer < 0) return;

      // Schedule notification 5 minutes before prayer
      const msUntilNotification = msUntilPrayer - (5 * 60 * 1000);
      
      if (msUntilNotification > 0) {
        const timer = setTimeout(() => {
          sendPrayerNotification(prayer.name, prayer.time);
          toast.info(`${prayer.name} prayer in 5 minutes! 🕌`);
        }, msUntilNotification);
        
        notificationTimersRef.current.push(timer);
      }

      // Schedule notification at exact prayer time
      if (msUntilPrayer > 0) {
        const timer = setTimeout(() => {
          sendPrayerNotification(prayer.name, prayer.time);
          toast.success(`It's time for ${prayer.name} prayer! 🕌`);
          
          // Auto-play selected reciter if available
          if (selectedReciter) {
            const reciter = ADHAN_RECITERS.find(r => r.id === selectedReciter);
            if (reciter) {
              toggleAdhanAudio(reciter);
            }
          }
        }, msUntilPrayer);
        
        notificationTimersRef.current.push(timer);
      }
    });

    toast.success(`Prayer notifications scheduled for ${prayerTimes.length} prayers today! 🔔`);
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      // Request permission and enable
      const granted = await requestPermission();
      if (granted) {
        setNotificationsEnabled(true);
        // Schedule notifications after enabling
        setTimeout(schedulePrayerNotifications, 100);
      }
    } else {
      // Disable notifications
      setNotificationsEnabled(false);
      notificationTimersRef.current.forEach(timer => clearTimeout(timer));
      notificationTimersRef.current = [];
      toast.info('Prayer notifications disabled');
    }
  };

  // Re-schedule notifications when prayer times change
  useEffect(() => {
    if (notificationsEnabled && prayerTimes.length > 0) {
      schedulePrayerNotifications();
    }
  }, [prayerTimes, notificationsEnabled, selectedReciter]);

  const filteredReciters = ADHAN_RECITERS.filter((reciter) =>
    reciter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reciter.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reciter.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>
      
      <Card className="bg-gradient-to-br from-amber-950/30 to-black border-amber-900/30 p-6">
        <h2 className="text-2xl font-bold text-amber-400 mb-4 flex items-center gap-2">
          <MapPin className="w-6 h-6" />
          Prayer Times
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-black/50 border-amber-900/30 text-white placeholder:text-gray-500"
            />
            <Input
              type="text"
              placeholder="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="bg-black/50 border-amber-900/30 text-white placeholder:text-gray-500"
            />
          </div>

          <Button
            onClick={fetchPrayerTimes}
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
          >
            <Search className="w-4 h-4 mr-2" />
            {loading ? 'Loading...' : 'Get Prayer Times'}
          </Button>
        </div>

        {prayerTimes.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-amber-300">Today's Prayer Times</h3>
              <Button
                onClick={toggleNotifications}
                variant="outline"
                size="sm"
                className={`${
                  notificationsEnabled
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                    : 'bg-black/30 border-amber-900/30 text-gray-400'
                } hover:bg-amber-500/30`}
              >
                {notificationsEnabled ? (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications On
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4 mr-2" />
                    Enable Notifications
                  </>
                )}
              </Button>
            </div>
            {prayerTimes.map((prayer) => (
              <div
                key={prayer.name}
                className="flex justify-between items-center bg-black/30 border border-amber-900/20 rounded-lg p-4"
              >
                <span className="text-white font-medium">{prayer.name}</span>
                <span className="text-amber-400 font-bold text-lg">{prayer.time}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="bg-gradient-to-br from-amber-950/30 to-black border-amber-900/30 p-6">
        <h2 className="text-2xl font-bold text-amber-400 mb-4 flex items-center gap-2">
          <Volume2 className="w-6 h-6" />
          Adhan Reciters
        </h2>

        <Input
          type="text"
          placeholder="Search reciters..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-black/50 border-amber-900/30 text-white placeholder:text-gray-500 mb-4"
        />

        <div className="space-y-3">
          {filteredReciters.map((reciter) => (
            <div
              key={reciter.id}
              className={`bg-black/30 border rounded-lg p-4 transition-all ${
                selectedReciter === reciter.id
                  ? 'border-amber-500/50 bg-amber-950/20'
                  : 'border-amber-900/20 hover:border-amber-800/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg">{reciter.name}</h3>
                  <p className="text-amber-400/80 text-sm mt-1">
                    {reciter.location}, {reciter.country}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">{reciter.region}</p>
                </div>

                <button
                  onClick={() => toggleAdhanAudio(reciter)}
                  className={`ml-4 p-3 rounded-full transition-all ${
                    playingReciter === reciter.id
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-amber-900/30 hover:bg-amber-800/40 border border-amber-800/50'
                  }`}
                >
                  {playingReciter === reciter.id ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-amber-400" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
