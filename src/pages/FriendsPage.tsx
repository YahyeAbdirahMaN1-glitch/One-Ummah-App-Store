import { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Users, Search, UserPlus, Check, X } from 'lucide-react';

interface Friend {
  id: string;
  name: string;
  location: string;
  image: string;
  status: 'friend' | 'pending' | 'suggested';
  mutualFriends?: number;
}

export default function FriendsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'requests' | 'suggestions'>('all');
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchEmail, setSearchEmail] = useState('');

  const filteredFriends = friends.filter(friend => {
    const matchesSearch = friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          friend.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'requests' ? friend.status === 'pending' :
      activeTab === 'suggestions' ? friend.status === 'suggested' :
      true;
    return matchesSearch && matchesTab;
  });

  const searchByEmail = async () => {
    if (!searchEmail.trim()) return;
    
    // TODO: Replace with actual API call
    // For now, just show a message
    alert(`Searching for user with email: ${searchEmail}`);
  };

  const addFriend = (id: string) => {
    setFriends(friends.map(f =>
      f.id === id ? { ...f, status: 'pending' as const } : f
    ));
  };

  const acceptFriend = (id: string) => {
    setFriends(friends.map(f =>
      f.id === id ? { ...f, status: 'friend' as const } : f
    ));
  };

  const removeFriend = (id: string) => {
    setFriends(friends.filter(f => f.id !== id));
  };

  const friendCount = friends.filter(f => f.status === 'friend').length;
  const requestCount = friends.filter(f => f.status === 'pending').length;
  const suggestionCount = friends.filter(f => f.status === 'suggested').length;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-amber-950/30 to-black border-amber-900/30 p-6">
        <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2 mb-6">
          <Users className="w-6 h-6" />
          Friends
        </h2>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-black/30 border border-amber-900/20 rounded-lg p-4 text-center">
            <p className="text-amber-400 text-2xl font-bold">{friendCount}</p>
            <p className="text-gray-400 text-sm">Friends</p>
          </div>
          <div className="bg-black/30 border border-amber-900/20 rounded-lg p-4 text-center">
            <p className="text-amber-400 text-2xl font-bold">{requestCount}</p>
            <p className="text-gray-400 text-sm">Requests</p>
          </div>
          <div className="bg-black/30 border border-amber-900/20 rounded-lg p-4 text-center">
            <p className="text-amber-400 text-2xl font-bold">{suggestionCount}</p>
            <p className="text-gray-400 text-sm">Suggestions</p>
          </div>
        </div>

        {/* Search by Email */}
        <div className="mb-4">
          <label className="text-white text-sm font-medium mb-2 block">Find Friends by Email</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                type="email"
                placeholder="Enter email address..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchByEmail()}
                className="pl-10 bg-black/50 border-amber-900/30 text-white placeholder:text-gray-500"
              />
            </div>
            <Button
              onClick={searchByEmail}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            >
              Search
            </Button>
          </div>
        </div>

        {/* Search Friends List */}
        {friends.length > 0 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search your friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/50 border-amber-900/30 text-white placeholder:text-gray-500"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 px-4 rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                : 'bg-black/30 border border-amber-900/30 text-gray-400'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 px-4 rounded-lg transition-all ${
              activeTab === 'requests'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                : 'bg-black/30 border border-amber-900/30 text-gray-400'
            }`}
          >
            Requests {requestCount > 0 && `(${requestCount})`}
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 py-2 px-4 rounded-lg transition-all ${
              activeTab === 'suggestions'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                : 'bg-black/30 border border-amber-900/30 text-gray-400'
            }`}
          >
            Suggestions
          </button>
        </div>

        {/* Friends List */}
        {filteredFriends.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">No friends yet</p>
            <p className="text-gray-500 text-sm">
              {searchQuery ? 'No friends found' : 'Search by email to find and connect with other members'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFriends.map(friend => (
              <div
                key={friend.id}
                className="flex items-center gap-3 p-4 bg-black/30 border border-amber-900/20 rounded-lg"
              >
                <div className="text-3xl">{friend.image}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold">{friend.name}</h3>
                  <p className="text-gray-400 text-sm">{friend.location}</p>
                  {friend.mutualFriends && (
                    <p className="text-amber-400 text-xs mt-1">
                      {friend.mutualFriends} mutual friends
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {friend.status === 'friend' && (
                    <Button
                      onClick={() => removeFriend(friend.id)}
                      variant="outline"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                    >
                      Remove
                    </Button>
                  )}
                  {friend.status === 'pending' && (
                    <>
                      <Button
                        onClick={() => acceptFriend(friend.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => removeFriend(friend.id)}
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {friend.status === 'suggested' && (
                    <Button
                      onClick={() => addFriend(friend.id)}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Friend
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
