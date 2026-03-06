import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Bell, BellOff, Locate } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { useNotifications } from '../hooks/useNotifications';

interface PrayerTime {
  name: string;
  time: string;
}

export default function PrayerTimesPage() {
  const { permission, requestPermission, sendPrayerNotification } = useNotifications();
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const notificationTimersRef = useRef<NodeJS.Timeout[]>([]);

  const useCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLoadingLocation(true);
    toast.info('Getting your location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Get location name from coordinates using reverse geocoding
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          
          if (!geoResponse.ok) throw new Error('Failed to get location name');
          
          const geoData = await geoResponse.json();
          const detectedCity = geoData.address.city || geoData.address.town || geoData.address.village || 'Unknown';
          const detectedCountry = geoData.address.country || 'Unknown';
          
          setCity(detectedCity);
          setCountry(detectedCountry);
          
          // Automatically fetch prayer times
          await fetchPrayerTimesByCoordinates(latitude, longitude, detectedCity, detectedCountry);
          
        } catch (error) {
          console.error('Error getting location name:', error);
          // Still try to get prayer times with coordinates
          await fetchPrayerTimesByCoordinates(latitude, longitude, 'Your location', 'Detected');
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLoadingLocation(false);
        
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location permission denied. Please enable location access in your browser settings.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          toast.error('Location information unavailable. Please enter your city manually.');
        } else {
          toast.error('Failed to get your location. Please enter your city manually.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const fetchPrayerTimesByCoordinates = async (lat: number, lon: number, cityName: string, countryName: string) => {
    try {
      const response = await fetch(
        `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=2`
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

      toast.success(`Prayer times loaded for ${cityName}, ${countryName}`);
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      toast.error('Failed to load prayer times. Please try again.');
    }
  };

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

      toast.success(`Prayer times loaded for ${city}, ${country}`);
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      toast.error('Failed to load prayer times. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = async () => {
    console.log('[PrayerTimes] Toggle notifications clicked', { 
      current: notificationsEnabled, 
      permission,
      prayerTimesCount: prayerTimes.length,
      isSupported: 'Notification' in window
    });

    if (!notificationsEnabled) {
      // Check if Notification API is supported
      if (!('Notification' in window)) {
        console.error('[PrayerTimes] Notification API not supported');
        toast.error('Notifications are not supported on this device/browser');
        return;
      }

      if (prayerTimes.length === 0) {
        console.warn('[PrayerTimes] No prayer times loaded');
        toast.error('Please fetch prayer times first');
        return;
      }

      // Request permission first
      console.log('[PrayerTimes] Requesting notification permission...');
      toast.info('Please allow notifications when prompted');
      
      const granted = await requestPermission();
      console.log('[PrayerTimes] Permission result:', granted);
      
      if (!granted) {
        console.warn('[PrayerTimes] Permission not granted');
        toast.error('Notification permission denied. Please enable notifications in Settings → One Ummah → Notifications');
        return;
      }

      // Schedule notifications
      console.log('[PrayerTimes] Scheduling prayer notifications...');
      try {
        schedulePrayerNotifications();
        setNotificationsEnabled(true);
        toast.success('Prayer notifications enabled! You will be notified 5 minutes before each prayer.');
        console.log('[PrayerTimes] Notifications successfully enabled');
      } catch (error) {
        console.error('[PrayerTimes] Failed to schedule notifications:', error);
        toast.error('Failed to schedule notifications. Please try again.');
      }
    } else {
      // Clear all timers
      console.log('[PrayerTimes] Disabling notifications, timers count:', notificationTimersRef.current.length);
      notificationTimersRef.current.forEach(clearTimeout);
      notificationTimersRef.current = [];
      setNotificationsEnabled(false);
      toast.success('Prayer notifications disabled');
      console.log('[PrayerTimes] Notifications disabled');
    }
  };

  const schedulePrayerNotifications = () => {
    // Clear existing timers
    notificationTimersRef.current.forEach(clearTimeout);
    notificationTimersRef.current = [];

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    prayerTimes.forEach((prayer) => {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerMinutes = hours * 60 + minutes;

      // Schedule notification 5 minutes before
      const minutesUntilReminder = prayerMinutes - currentTime - 5;
      if (minutesUntilReminder > 0) {
        const timeout = setTimeout(() => {
          sendPrayerNotification(
            `${prayer.name} in 5 minutes`,
            `${prayer.name} prayer time is in 5 minutes (${prayer.time})`
          );
        }, minutesUntilReminder * 60 * 1000);
        notificationTimersRef.current.push(timeout);
      }

      // Schedule notification at prayer time
      const minutesUntilPrayer = prayerMinutes - currentTime;
      if (minutesUntilPrayer > 0) {
        const timeout = setTimeout(() => {
          sendPrayerNotification(
            `Time for ${prayer.name}`,
            `It's time for ${prayer.name} prayer (${prayer.time})`
          );
        }, minutesUntilPrayer * 60 * 1000);
        notificationTimersRef.current.push(timeout);
      }
    });
  };

  useEffect(() => {
    return () => {
      notificationTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white py-6 px-4 shadow-lg">
        <h1 className="text-3xl font-bold text-center">Prayer Times</h1>
        <p className="text-center text-amber-100 mt-2">Find prayer times for your location</p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Search Section */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-amber-500/20 p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-400 mb-4">
              <MapPin className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Location</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">City</label>
                <Input
                  placeholder="e.g., London"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-gray-900/50 border-gray-700 text-white"
                  onKeyDown={(e) => e.key === 'Enter' && fetchPrayerTimes()}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Country</label>
                <Input
                  placeholder="e.g., United Kingdom"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="bg-gray-900/50 border-gray-700 text-white"
                  onKeyDown={(e) => e.key === 'Enter' && fetchPrayerTimes()}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={useCurrentLocation}
                disabled={loadingLocation || loading}
                variant="outline"
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white border-green-500"
              >
                <Locate className="w-4 h-4 mr-2" />
                {loadingLocation ? 'Getting Location...' : 'Use My Location'}
              </Button>

              <Button
                onClick={fetchPrayerTimes}
                disabled={loading || loadingLocation}
                className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white"
              >
                <Search className="w-4 h-4 mr-2" />
                {loading ? 'Loading...' : 'Search City'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Prayer Times Display */}
        {prayerTimes.length > 0 && (
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-amber-500/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-amber-400">Today's Prayer Times</h2>
              <Button
                onClick={toggleNotifications}
                variant="outline"
                className={`${
                  notificationsEnabled
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-gray-800 text-gray-300 border-gray-700'
                } hover:bg-amber-600`}
              >
                {notificationsEnabled ? (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications On
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4 mr-2" />
                    Notifications Off
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {prayerTimes.map((prayer) => (
                <div
                  key={prayer.name}
                  className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-xl p-4 border border-amber-500/20 hover:border-amber-500/40 transition-all"
                >
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-amber-300 mb-2">{prayer.name}</h3>
                    <p className="text-3xl font-bold text-white">{prayer.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400 text-center">
                Prayer times for <span className="text-amber-400 font-semibold">{city}, {country}</span>
              </p>
              {notificationsEnabled && (
                <p className="text-xs text-green-400 text-center mt-2">
                  ✓ You'll be notified 5 minutes before each prayer and at prayer time
                </p>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
