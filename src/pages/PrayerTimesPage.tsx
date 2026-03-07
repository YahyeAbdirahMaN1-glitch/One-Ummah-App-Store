// src/pages/PrayerTimesPage.tsx
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

  // Get current location
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
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const geoData = await geoResponse.json();
          const detectedCity =
            geoData.address.city || geoData.address.town || geoData.address.village || 'Unknown';
          const detectedCountry = geoData.address.country || 'Unknown';
          setCity(detectedCity);
          setCountry(detectedCountry);
          await fetchPrayerTimesByCoordinates(latitude, longitude, detectedCity, detectedCountry);
        } catch (error) {
          console.error('Error getting location name:', error);
          await fetchPrayerTimesByCoordinates(latitude, longitude, 'Your location', 'Detected');
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLoadingLocation(false);
        toast.error('Failed to get location. Please enter city manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Fetch prayer times by coordinates
  const fetchPrayerTimesByCoordinates = async (
    lat: number,
    lon: number,
    cityName: string,
    countryName: string
  ) => {
    try {
      const response = await fetch(
        `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=2`
      );
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
      toast.error('Failed to load prayer times');
    }
  };

  // Fetch prayer times by city + country
  const fetchPrayerTimes = async () => {
    if (!city.trim() || !country.trim()) {
      toast.error('Please enter both city and country');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(
          country
        )}`
      );
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
      toast.error('Failed to load prayer times');
    } finally {
      setLoading(false);
    }
  };

  // Toggle notifications
  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      if (!('Notification' in window)) {
        toast.error('Notifications are not supported on this device/browser');
        return;
      }
      if (prayerTimes.length === 0) {
        toast.error('Please fetch prayer times first');
        return;
      }
      toast.info('Please allow notifications when prompted');
      const granted = await requestPermission();
      if (!granted) {
        toast.error('Notification permission denied. Enable notifications in Settings');
        return;
      }
      schedulePrayerNotifications();
      setNotificationsEnabled(true);
      toast.success('Prayer notifications enabled!');
    } else {
      notificationTimersRef.current.forEach(clearTimeout);
      notificationTimersRef.current = [];
      setNotificationsEnabled(false);
      toast.success('Prayer notifications disabled');
    }
  };

  // Schedule notifications
  const schedulePrayerNotifications = () => {
    notificationTimersRef.current.forEach(clearTimeout);
    notificationTimersRef.current = [];

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    prayerTimes.forEach((prayer) => {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerMinutes = hours * 60 + minutes;

      // 15 minutes before
      const beforeMinutes = prayerMinutes - currentMinutes - 15;
      if (beforeMinutes > 0) {
        const timeout = setTimeout(() => {
          sendPrayerNotification(
            `${prayer.name} in 15 minutes`,
            `${prayer.name} prayer is in 15 minutes (${prayer.time})`
          );
        }, beforeMinutes * 60 * 1000);
        notificationTimersRef.current.push(timeout);
      }

      // At prayer time
      const atMinutes = prayerMinutes - currentMinutes;
      if (atMinutes > 0) {
        const timeout = setTimeout(() => {
          sendPrayerNotification(`Time for ${prayer.name}`, `It's time for ${prayer.name} prayer (${prayer.time})`);
        }, atMinutes * 60 * 1000);
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
    <div className="flex-1 bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
      {/* Location / Search */}
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-amber-500/20 p-6 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">City</label>
            <Input
              placeholder="e.g., London"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPrayerTimes()}
              className="bg-gray-900/50 border-gray-700 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Country</label>
            <Input
              placeholder="e.g., United Kingdom"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPrayerTimes()}
              className="bg-gray-900/50 border-gray-700 text-white"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button onClick={useCurrentLocation} disabled={loadingLocation || loading}>
            <Locate className="w-4 h-4 mr-2" />
            {loadingLocation ? 'Getting Location...' : 'Use My Location'}
          </Button>
          <Button onClick={fetchPrayerTimes} disabled={loading || loadingLocation}>
            <Search className="w-4 h-4 mr-2" />
            {loading ? 'Loading...' : 'Search City'}
          </Button>
        </div>
      </Card>

      {/* Prayer Times */}
      {prayerTimes.length > 0 && (
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-amber-500/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-amber-400">Today's Prayer Times</h2>
            <Button onClick={toggleNotifications} variant="outline">
              {notificationsEnabled ? (
                <>
                  <Bell className="w-4 h-4 mr-2" /> On
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4 mr-2" /> Off
                </>
              )}
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {prayerTimes.map((prayer) => (
              <div key={prayer.name} className="bg-gray-900/80 rounded-xl p-4 border border-amber-500/20 hover:border-amber-500/40">
                <h3 className="text-lg font-semibold text-amber-300 mb-2 text-center">{prayer.name}</h3>
                <p className="text-3xl font-bold text-white text-center">{prayer.time}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
