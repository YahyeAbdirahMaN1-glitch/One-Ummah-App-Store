import { Card } from '../components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black p-4">
      <Card className="max-w-2xl mx-auto bg-gradient-to-br from-amber-950/30 to-black border-amber-900/30 p-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-amber-900/20 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-amber-400" />
          </button>
          <h1 className="text-3xl font-bold text-amber-400">Privacy Policy</h1>
        </div>
        
        <div className="text-gray-300 space-y-6 leading-relaxed">
          <p className="text-sm text-gray-400">Last updated: March 6, 2026</p>

          <section>
            <h2 className="text-xl font-semibold text-amber-400 mb-3">1. Information We Collect</h2>
            <p>
              One Ummah collects information you provide when creating an account, including your email address, 
              name, gender, profile picture, and optional location information for friend suggestions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-amber-400 mb-3">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Provide and maintain our Islamic social networking service</li>
              <li>Enable you to connect with other Muslims worldwide</li>
              <li>Send prayer time notifications based on your location</li>
              <li>Suggest friends from your city or country</li>
              <li>Display your posts, comments, and messages to other users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-amber-400 mb-3">3. Information Sharing</h2>
            <p>
              Your posts, profile information, and activity are visible to other One Ummah users. 
              We do not sell your personal information to third parties. Your email address remains private.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-amber-400 mb-3">4. Privacy Controls</h2>
            <p>You can control your privacy through Settings:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li><strong>Online Status:</strong> Choose to appear online or offline</li>
              <li><strong>Read Receipts:</strong> Control whether others see when you read messages</li>
              <li><strong>Profile Visibility:</strong> Your profile is visible to all One Ummah users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-amber-400 mb-3">5. Data Security</h2>
            <p>
              We use industry-standard security measures to protect your data. Passwords are encrypted using bcrypt hashing. 
              However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-amber-400 mb-3">6. Children's Privacy</h2>
            <p>
              One Ummah is intended for users aged 13 and older. We do not knowingly collect information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-amber-400 mb-3">7. Data Retention</h2>
            <p>
              We retain your information as long as your account is active. You may request account deletion by contacting support.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-amber-400 mb-3">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify users of significant changes through the app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-amber-400 mb-3">9. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please use the "Report a Problem" feature in Settings.
            </p>
          </section>

          <div className="mt-8 p-4 bg-amber-950/20 border border-amber-900/30 rounded-lg">
            <p className="text-sm text-amber-200">
              <strong>Islamic Values:</strong> One Ummah is committed to respecting your privacy in accordance with 
              Islamic principles of trust (Amanah) and protecting personal information.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
