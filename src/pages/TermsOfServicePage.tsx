import { Card } from '../components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfServicePage() {
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
          <h1 className="text-3xl font-bold text-amber-400">Terms of Service</h1>
        </div>
        
        <div className="text-gray-300 space-y-6 leading-relaxed">
          <p className="text-sm text-gray-400">Last updated: March 6, 2026</p>

          <section>
            <h2 className="text-xl font-semibold text-amber-400 mb-3">1. Acceptance of Terms</h2>
            <p>
              By creating an account and using One Ummah, you agree to these Terms of Service. 
              If you do not agree, please do not use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-amber-400 mb-3">2. Eligibility</h2>
            <p>
              You must be at least 13 years old to use One Ummah. By using the platform, you confirm that you meet this age requirement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-amber-400 mb-3">3. User Conduct</h2>
            <p>As a member of the One Ummah community, you agree to:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Treat all users with respect and kindness (Akhlaq)</li>
              <li>Post content that is halal and appropriate for all ages</li>
              <li>Not share harmful, hateful, or inappropriate content</li>
              <li>Not harass, bully, or threaten other users</li>
              <li>Not impersonate others or create fake accounts</li>
              <li>Not spam or send unsolicited messages</li>
              <li>Respect Islamic values and principles</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-amber-400 mb-3">4. Content Ownership</h2>
            <p>
              You retain ownership of content you post on One Ummah (posts, videos, comments, messages). 
              By posting, you grant One Ummah a license to display your content to other users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-amber-400 mb-3">5. Prohibited Content</h2>
            <p>The following content is strictly prohibited:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Haram or un-Islamic content</li>
              <li>Explicit, violent, or inappropriate material</li>
              <li>Hate speech, racism, or discrimination</li>
              <li>False information or misinformation</li>
              <li>Copyright infringement</li>
              <li>Promotion of illegal activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-amber-400 mb-3">6. Account Suspension</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms of Service. 
              Repeated violations may result in permanent ban.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-amber-400 mb-3">7. Prayer Times Accuracy</h2>
            <p>
              Prayer times are provided for convenience and calculated using the Aladhan API. 
              While we strive for accuracy, please verify with your local mosque or Islamic center.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-amber-400 mb-3">8. Disclaimer</h2>
            <p>
              One Ummah is provided "as is" without warranties. We are not responsible for user-generated content 
              or interactions between users. Use the platform at your own discretion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-amber-400 mb-3">9. Reporting Violations</h2>
            <p>
              If you see content or behavior that violates these terms, please report it using the "Report a Problem" 
              feature in Settings. We review all reports promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-amber-400 mb-3">10. Changes to Terms</h2>
            <p>
              We may update these Terms of Service. Continued use of One Ummah after changes constitutes acceptance 
              of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-amber-400 mb-3">11. Contact</h2>
            <p>
              For questions about these Terms, use the "Report a Problem" feature in Settings.
            </p>
          </section>

          <div className="mt-8 p-4 bg-amber-950/20 border border-amber-900/30 rounded-lg">
            <p className="text-sm text-amber-200">
              <strong>Islamic Community:</strong> One Ummah is built on principles of brotherhood/sisterhood (Ukhuwah), 
              mutual respect, and Islamic values. Let us use this platform to strengthen our Ummah. ☪️
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
