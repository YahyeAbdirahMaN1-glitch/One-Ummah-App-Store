import { Card } from '../components/ui/card';
import { Users } from 'lucide-react';

export default function FriendsPage() {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-amber-950/30 to-black border-amber-900/30 p-6">
        <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
          <Users className="w-6 h-6" />
          Friends
        </h2>
        <p className="text-gray-400 mt-4">Friend suggestions and requests - Coming soon</p>
      </Card>
    </div>
  );
}
