import { Card } from '../components/ui/card';
import { MessageCircle } from 'lucide-react';

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-amber-950/30 to-black border-amber-900/30 p-6">
        <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
          <MessageCircle className="w-6 h-6" />
          Messages
        </h2>
        <p className="text-gray-400 mt-4">Direct messaging - Coming soon</p>
      </Card>
    </div>
  );
}
