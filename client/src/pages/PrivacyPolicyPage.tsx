import React from 'react';
import { PageWrapper } from '../components/PageWrapper';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <PageWrapper>
      <div className="text-center py-12">
        <div className="section-label mb-4">LEGAL</div>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Privacy Policy</h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto text-balance">
          Last updated: October 24, 2025
        </p>
      </div>

      <section className="py-12">
        <div className="glass-card p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Information We Collect</h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            We collect information you provide directly when you create an account, including your name, email address, and GitHub or Google profile information through OAuth authentication.
          </p>
          <p className="text-slate-300 leading-relaxed">
            We also collect information about your activity on the platform, including case submissions, reviews, and credibility scores. This data is used to maintain the integrity of the peer-review system and to provide you with accurate credentials.
          </p>
        </div>

        <div className="glass-card p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">How We Use Your Information</h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            We use your information to:
          </p>
          <ul className="text-slate-300 leading-relaxed list-disc list-inside space-y-2">
            <li>Provide and improve our case competition platform</li>
            <li>Process and display your submissions and reviews</li>
            <li>Calculate and display your credibility scores and tiers</li>
            <li>Enable peer review and quality control processes</li>
            <li>Communicate with you about platform updates and relevant opportunities</li>
          </ul>
        </div>

        <div className="glass-card p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Data Sharing and Disclosure</h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            We do not sell your personal information. We may share your information in the following circumstances:
          </p>
          <ul className="text-slate-300 leading-relaxed list-disc list-inside space-y-2">
            <li>With other users for peer review purposes (submission content and reviewer scores are visible within the platform)</li>
            <li>With companies when you opt to share your profile or certificate (only information you choose to make public)</li>
            <li>With service providers who perform services on our behalf (e.g., hosting, authentication providers)</li>
            <li>When required by law or to protect our rights and safety</li>
          </ul>
        </div>

        <div className="glass-card p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Data Security</h2>
          <p className="text-slate-300 leading-relaxed">
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
          </p>
        </div>

        <div className="glass-card p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Your Rights</h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            You have the right to:
          </p>
          <ul className="text-slate-300 leading-relaxed list-disc list-inside space-y-2">
            <li>Access and update your personal information</li>
            <li>Delete your account and associated data</li>
            <li>Request a copy of your personal data</li>
            <li>Opt out of certain data processing activities</li>
          </ul>
          <p className="text-slate-300 leading-relaxed mt-4">
            To exercise these rights, please contact us at the email address provided below.
          </p>
        </div>

        <div className="glass-card p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Cookies and Tracking</h2>
          <p className="text-slate-300 leading-relaxed">
            We use essential cookies to maintain your session and authentication. We do not use third-party tracking cookies for advertising purposes. You can manage cookie preferences through your browser settings.
          </p>
        </div>

        <div className="glass-card p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Children's Privacy</h2>
          <p className="text-slate-300 leading-relaxed">
            Our platform is not intended for users under the age of 16. We do not knowingly collect personal information from children under 16. If we become aware that we have collected such information, we will take steps to delete it.
          </p>
        </div>

        <div className="glass-card p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Changes to This Policy</h2>
          <p className="text-slate-300 leading-relaxed">
            We may update this privacy policy from time to time. We will notify users of significant changes by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
          <p className="text-slate-300 leading-relaxed">
            If you have questions about this privacy policy or our data practices, please contact us at: <a href="mailto:privacy@cracked.com" className="text-[#FF4C25] hover:underline">privacy@cracked.com</a>
          </p>
        </div>
      </section>
    </PageWrapper>
  );
};

export default PrivacyPolicyPage;
