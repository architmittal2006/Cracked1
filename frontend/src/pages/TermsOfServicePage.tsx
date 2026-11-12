import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { TERMS_VERSION } from '../constants/legal';

export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-deep)] text-[var(--text-primary)]">
      <div className="page-container py-16 max-w-3xl">
        <Link to="/" className="inline-block mb-8"><BrandLogo className="h-7 w-auto" /></Link>
        <h1 className="font-serif text-3xl font-semibold text-white">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: {TERMS_VERSION}</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-300">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. The service</h2>
            <p>Cracked is a platform for practicing business cases and guesstimates, submitting structured solutions, and learning from other participants&apos; work. By creating an account you agree to these Terms.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Acceptable use</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Do not submit plagiarized, copied, or misattributed work as your own.</li>
              <li>Do not impersonate other people or misrepresent your identity or credentials.</li>
              <li>Do not abuse, scrape, overload, or attempt to disrupt the service.</li>
              <li>Do not upload unlawful, harmful, or infringing content.</li>
              <li>Respect other users; harassment and bad-faith reviewing are prohibited.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Your content</h2>
            <p>You retain ownership of the solutions and materials you submit. You grant Cracked a limited, non-exclusive licence to host, display, and distribute that content within the platform as needed to operate the service, including showing it to other users as part of practice and comparison features.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Disclaimers</h2>
            <p>The service is provided &quot;as is&quot; without warranties of any kind. Content shared by users does not constitute professional, financial, or career advice. Cracked does not guarantee outcomes from using the platform.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Suspension and termination</h2>
            <p>We may suspend or terminate accounts that violate these Terms or misuse the platform. You may stop using the service at any time. Contact us to request account changes or deletion.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Changes and contact</h2>
            <p>We may update these Terms; continued use after changes constitutes acceptance of the updated version. Questions: <a href="mailto:hello@cracked.com" className="text-orange-300 hover:underline">hello@cracked.com</a>. See also our <Link to="/privacy" className="text-orange-300 hover:underline">Privacy Policy</Link>.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
