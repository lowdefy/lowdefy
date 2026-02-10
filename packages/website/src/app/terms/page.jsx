'use client';

import { Header, Footer } from '@/components';

export default function Terms() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white dark:bg-slate-950 pt-24 pb-20">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 font-mono">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-500 mb-12">
            Last updated: February 10, 2026
          </p>

          <div className="prose-custom">
            <Section title="Agreement to Terms">
              <p>
                By accessing or using the Lowdefy website at lowdefy.com, documentation at
                docs.lowdefy.com, or any related services (collectively, the &quot;Services&quot;),
                you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not
                agree, please do not use our Services.
              </p>
              <p>
                These Terms govern your use of our website and online services. Use of the Lowdefy
                open-source framework is governed by the{' '}
                <a
                  href="https://www.apache.org/licenses/LICENSE-2.0"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Apache License 2.0
                </a>
                , which applies independently of these Terms.
              </p>
            </Section>

            <Section title="Open-Source License">
              <p>
                The Lowdefy framework is open-source software released under the Apache License 2.0.
                This license grants you broad rights to use, modify, and distribute the software,
                subject to the conditions of that license.
              </p>
              <p>
                These Terms do not limit or modify the rights granted to you under the Apache
                License 2.0 with respect to the open-source code. In the event of a conflict between
                these Terms and the Apache License 2.0 regarding the framework code, the Apache
                License 2.0 prevails.
              </p>
            </Section>

            <Section title="Use of Our Services">
              <p>
                You agree to use our Services only for lawful purposes and in accordance with these
                Terms. You agree not to:
              </p>
              <ul>
                <li>Use the Services in any way that violates applicable laws or regulations</li>
                <li>
                  Attempt to interfere with or disrupt the integrity or performance of the Services
                </li>
                <li>
                  Attempt to gain unauthorized access to any part of the Services or related systems
                </li>
                <li>Use the Services to transmit malware, spam, or other harmful content</li>
                <li>
                  Scrape or collect data from the Services in a manner that burdens our
                  infrastructure
                </li>
                <li>Impersonate or misrepresent your affiliation with any person or entity</li>
              </ul>
            </Section>

            <Section title="Intellectual Property">
              <p>
                The Lowdefy framework source code is licensed under Apache 2.0 and is available on{' '}
                <a
                  href="https://github.com/lowdefy/lowdefy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
                .
              </p>
              <p>
                The Lowdefy name, logo, website design, documentation content (excluding code
                examples), and other branding materials are proprietary to Lowdefy, Inc. and are
                protected by intellectual property laws. You may not use our trademarks without
                prior written permission, except as permitted by applicable trademark fair use
                principles.
              </p>
              <p>
                Code examples in our documentation are provided under the Apache License 2.0 unless
                otherwise noted.
              </p>
            </Section>

            <Section title="Community Guidelines">
              <p>
                When participating in Lowdefy community spaces (GitHub Discussions, Discord, etc.),
                you agree to abide by our{' '}
                <a
                  href="https://github.com/lowdefy/lowdefy/blob/main/CODE_OF_CONDUCT.md"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Code of Conduct
                </a>
                . We reserve the right to remove content or restrict access to community spaces for
                violations of these guidelines.
              </p>
            </Section>

            <Section title="Third-Party Services">
              <p>
                Our Services may contain links to or integrations with third-party websites and
                services (including GitHub, Discord, and npm). We are not responsible for the
                content, policies, or practices of any third-party services. Your use of such
                services is governed by their respective terms.
              </p>
            </Section>

            <Section title="Disclaimer of Warranties">
              <p>
                THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT
                WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
                IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
                NON-INFRINGEMENT.
              </p>
              <p>
                We do not warrant that the Services will be uninterrupted, error-free, or secure, or
                that any defects will be corrected. The Lowdefy framework is open-source software
                provided under the terms of the Apache License 2.0, which includes its own warranty
                disclaimers.
              </p>
            </Section>

            <Section title="Limitation of Liability">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, LOWDEFY, INC. AND ITS OFFICERS, DIRECTORS,
                EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER
                INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER
                INTANGIBLE LOSSES ARISING FROM:
              </p>
              <ul>
                <li>Your use of or inability to use the Services</li>
                <li>
                  Any unauthorized access to or use of our servers or any personal information
                  stored therein
                </li>
                <li>Any bugs, viruses, or other harmful code transmitted through the Services</li>
                <li>Any content obtained from the Services</li>
              </ul>
            </Section>

            <Section title="Indemnification">
              <p>
                You agree to indemnify and hold harmless Lowdefy, Inc. and its officers, directors,
                employees, and agents from any claims, damages, losses, liabilities, and expenses
                (including reasonable legal fees) arising out of or related to your use of the
                Services or your violation of these Terms.
              </p>
            </Section>

            <Section title="Termination">
              <p>
                We may suspend or terminate your access to the Services at any time, with or without
                cause, and with or without notice. Upon termination, your right to use the Services
                ceases immediately.
              </p>
              <p>
                Your rights under the Apache License 2.0 to use the open-source Lowdefy framework
                code are not affected by termination of these Terms.
              </p>
            </Section>

            <Section title="Governing Law">
              <p>
                These Terms are governed by and construed in accordance with the laws of the
                Republic of South Africa, without regard to conflict of law principles. Any disputes
                arising from these Terms shall be resolved in the courts of South Africa.
              </p>
            </Section>

            <Section title="Changes to These Terms">
              <p>
                We may revise these Terms at any time by updating this page. The &quot;Last
                updated&quot; date at the top indicates when the Terms were last modified. Your
                continued use of the Services after changes constitutes acceptance of the revised
                Terms.
              </p>
            </Section>

            <Section title="Contact Us">
              <p>If you have questions about these Terms, please contact us:</p>
              <ul>
                <li>
                  Email: <a href="mailto:legal@lowdefy.com">legal@lowdefy.com</a>
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
