import { useState, useEffect, useRef } from 'react';
import { Search, Play, Pause, MapPin, Volume2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

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
    audioFile: '/adhans/hafiz-mustafa.mp3',
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
    audioFile: '/adhans/minshawi.mp3',
  },
];

export default function PrayerTimesPage() {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReciter, setSelectedReciter] = useState<string | null>(null);
  const [playingReciter, setPlayingReciter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
      
      audioRef.current = audio;
      setPlayingReciter(reciter.id);

      // Set source and wait for 'canplay' event before playing (iOS fix)
      audio.src = reciter.audioFile;
      
      return new Promise<void>((resolve, reject) => {
        const playTimeout = setTimeout(() => {
          reject(new Error('Audio loading timeout'));
        }, 10000); // 10 second timeout

        audio.addEventListener('canplay', async () => {
          clearTimeout(playTimeout);
          try {
            await audio.play();
            resolve();
          } catch (playError: any) {
            console.error('Play error:', playError);
            setPlayingReciter(null);
            
            // iOS-specific error messages
            if (playError.name === 'AbortError') {
              toast.error('Playback interrupted. Please try again.');
            } else if (playError.name === 'NotAllowedError') {
              toast.error('Please enable audio permissions and try again.');
            } else {
              toast.error('Failed to play Adhan. Please try again.');
            }
            reject(playError);
          }
        });

        audio.addEventListener('ended', () => {
          setPlayingReciter(null);
          audioRef.current = null;
        });

        audio.addEventListener('error', (e) => {
          clearTimeout(playTimeout);
          console.error('Audio error:', e);
          setPlayingReciter(null);
          toast.error('Failed to load Adhan audio');
          reject(new Error('Audio load error'));
        });

        // Start loading the audio
        audio.load();
      });
    } catch (error: any) {
      console.error('Adhan playback error:', error);
      setPlayingReciter(null);
      audioRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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
            <h3 className="text-lg font-semibold text-amber-300">Today's Prayer Times</h3>
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
