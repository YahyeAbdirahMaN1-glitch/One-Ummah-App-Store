import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API_URL } from '../config';
import { CapacitorHttp } from '@capacitor/core';
import { AlertCircle } from 'lucide-react';

export default function ReportProblemPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!user) {
      toast.error('Please sign in to report a problem');
      return;
    }

    setLoading(true);
    try {
      const response = await CapacitorHttp.post({
        url: `${API_URL}/reportIssue`,
        headers: { 'Content-Type': 'application/json' },
        data: { 
          userId: user.id,
          subject, 
          description 
        },
      });

      if (response.status === 200) {
        toast.success('Report submitted successfully! We\'ll review it soon.');
        setSubject('');
        setDescription('');
      } else {
        toast.error('Failed to submit report');
      }
    } catch (error) {
      console.error('Report submission error:', error);
      toast.error('Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-amber-950/30 to-black border-amber-900/30 p-6">
        <div className="flex items-center gap-2 mb-6">
          <AlertCircle className="w-6 h-6 text-amber-400" />
          <h2 className="text-2xl font-bold text-amber-400">Report a Problem</h2>
        </div>

        <div className="mb-6 p-4 bg-amber-950/20 border border-amber-900/30 rounded-lg">
          <p className="text-sm text-gray-300 leading-relaxed">
            Found a bug? Inappropriate content? Technical issue? Let us know and we'll investigate promptly.
            Your feedback helps us improve One Ummah for the entire Ummah!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Type of Issue
            </label>
            <Input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-black/50 border-amber-900/30 text-white"
              placeholder="e.g. Bug, Inappropriate Content, Feature Request"
            />
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Details
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-black/50 border-amber-900/30 text-white min-h-[150px]"
              placeholder="Please describe the issue in detail. Include steps to reproduce if it's a bug..."
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
