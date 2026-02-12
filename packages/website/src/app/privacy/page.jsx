'use client';

import { Header, Footer } from '@/components';

export default function Privacy() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white dark:bg-slate-950 pt-24 pb-20">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 font-mono">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-500 mb-12">
            Last updated: February 10, 2026
          </p>

          <div className="prose-custom">
            <Section title="Introduction">
              <p>
                Lowdefy, Inc. (&quot;Lowdefy,&quot; &quot;we,&quot; &quot;us,&quot; or
                &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your information when you
                visit our website at lowdefy.com and docs.lowdefy.com (the &quot;Sites&quot;), use
                our open-source framework, or interact with our community.
              </p>
              <p>
                Lowdefy is an open-source project licensed under Apache 2.0. We believe in
                transparency in both our code and our data practices.
              </p>
            </Section>

            <Section title="Information We Collect">
              <h3>Information you provide</h3>
              <ul>
                <li>Contact information when you reach out to us (name, email)</li>
                <li>Feedback or bug reports submitted through GitHub Issues or Discussions</li>
                <li>Messages sent in our Discord community</li>
              </ul>

              <h3>Information collected automatically</h3>
              <p>
                When you visit our Sites, we use <strong>PostHog</strong> (a privacy-focused
                analytics platform) to collect anonymized usage data, including:
              </p>
              <ul>
                <li>Pages visited and navigation patterns</li>
                <li>Browser type, device type, and screen resolution</li>
                <li>Approximate geographic location (country/region level)</li>
                <li>Referral source</li>
              </ul>
              <p>
                We do <strong>not</strong> collect personally identifiable information through
                analytics. PostHog data is used solely to understand how our Sites are used and to
                improve the experience.
              </p>

              <h3>Information from third parties</h3>
              <p>
                If you interact with us through GitHub or Discord, those platforms may share limited
                profile information (such as your username) in accordance with their own privacy
                policies.
              </p>
            </Section>

            <Section title="How We Use Your Information">
              <ul>
                <li>To operate, maintain, and improve our Sites and documentation</li>
                <li>To understand usage patterns and prioritize features</li>
                <li>To respond to your inquiries and provide support</li>
                <li>To send important updates about the Lowdefy project (only if you opt in)</li>
                <li>To detect, prevent, and address technical issues</li>
              </ul>
              <p>
                We will <strong>never</strong> sell your personal information to third parties.
              </p>
            </Section>

            <Section title="Cookies &amp; Tracking">
              <p>
                Our Sites use minimal cookies. PostHog analytics may use first-party cookies to
                distinguish unique visitors and sessions. We do not use third-party advertising
                cookies or cross-site tracking pixels.
              </p>
              <p>
                You can disable cookies through your browser settings. The Sites will continue to
                function without them.
              </p>
            </Section>

            <Section title="How We Share Information">
              <p>We may share information with:</p>
              <ul>
                <li>
                  <strong>Service providers</strong> that help us operate our Sites (e.g., PostHog
                  for analytics, Vercel for hosting). These providers are contractually obligated to
                  protect your data.
                </li>
                <li>
                  <strong>Legal authorities</strong> if required by law, regulation, or legal
                  process.
                </li>
              </ul>
              <p>We do not share, sell, or rent personal information for marketing purposes.</p>
            </Section>

            <Section title="Data Retention">
              <p>
                Analytics data is retained for up to 12 months. If you contact us directly, we
                retain your correspondence for as long as necessary to resolve your inquiry and for
                our legitimate business records.
              </p>
            </Section>

            <Section title="Data Security">
              <p>
                We implement reasonable technical and organizational measures to protect your
                information. However, no method of transmission over the internet is 100% secure,
                and we cannot guarantee absolute security.
              </p>
            </Section>

            <Section title="Your Rights">
              <p>Depending on your jurisdiction, you may have the right to:</p>
              <ul>
                <li>Access the personal information we hold about you</li>
                <li>Request correction or deletion of your data</li>
                <li>Object to or restrict certain processing</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p>
                <strong>EU/UK residents:</strong> You have rights under GDPR/UK GDPR including the
                above. You may also lodge a complaint with your local supervisory authority.
              </p>
              <p>
                <strong>California residents:</strong> Under the CCPA, you have the right to know
                what personal information is collected, request deletion, and opt out of the sale of
                personal information. We do not sell personal information.
              </p>
              <p>To exercise any of these rights, contact us at the address below.</p>
            </Section>

            <Section title="Third-Party Services">
              <p>
                Our Sites contain links to third-party services including GitHub, Discord, and
                YouTube. These services have their own privacy policies, and we encourage you to
                review them:
              </p>
              <ul>
                <li>
                  <a
                    href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub Privacy Statement
                  </a>
                </li>
                <li>
                  <a href="https://discord.com/privacy" target="_blank" rel="noopener noreferrer">
                    Discord Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer">
                    PostHog Privacy Policy
                  </a>
                </li>
              </ul>
            </Section>

            <Section title="Children&rsquo;s Privacy">
              <p>
                Our Sites are not directed at children under 13. We do not knowingly collect
                personal information from children. If you believe a child has provided us with
                personal information, please contact us and we will delete it promptly.
              </p>
            </Section>

            <Section title="Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material
                changes by updating the &quot;Last updated&quot; date at the top of this page. We
                encourage you to review this policy periodically.
              </p>
            </Section>

            <Section title="Contact Us">
              <p>
                If you have questions about this Privacy Policy or wish to exercise your privacy
                rights, please contact us:
              </p>
              <ul>
                <li>
                  Email: <a href="mailto:privacy@lowdefy.com">privacy@lowdefy.com</a>
                </li>
                <li>
                  GitHub:{' '}
                  <a
                    href="https://github.com/lowdefy/lowdefy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    github.com/lowdefy/lowdefy
                  </a>
                </li>
              </ul>
            </Section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 font-mono">
        {title}
      </h2>
      <div className="space-y-3 text-slate-600 dark:text-slate-400 leading-relaxed [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-800 [&_h3]:dark:text-slate-200 [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-primary-500 [&_a]:hover:text-primary-400 [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors">
        {children}
      </div>
    </section>
  );
}
