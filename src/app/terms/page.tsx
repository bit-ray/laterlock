import Link from "next/link";

export default function TermsOfService() {
  return (
    <main className="flex min-h-screen flex-col items-center py-16 px-4 md:px-8">
      <div className="max-w-3xl w-full">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-primary">Terms of Service</h1>
          <p className="mt-2 text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using LaterLock (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p>
              LaterLock is a service that allows users to store text content with time-delayed access. The Service encrypts and stores user-provided content and makes it available after a user-specified delay period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Prohibited Uses</h2>
            <p className="mb-4">
              You agree not to use the Service for any of the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Storing or sharing any illegal content, including but not limited to content that violates local, state, national, or international laws or regulations.</li>
              <li>Storing or sharing content that infringes on intellectual property rights, including copyright, trademark, patent, or trade secret.</li>
              <li>Storing or sharing harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable content.</li>
              <li>Storing or sharing content that promotes illegal activities or harm to others.</li>
              <li>Attempting to interfere with, compromise, or disrupt the Service or servers or networks connected to the Service.</li>
              <li>Using the Service for any purpose that violates the privacy or other rights of third parties.</li>
              <li>Using the Service to store or transmit malware, viruses, or other malicious code.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Disclaimer of Warranties</h2>
            <p className="mb-4">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
            <p>
              We do not guarantee that the Service will be uninterrupted, secure, or error-free. We do not guarantee the preservation or confidentiality of any content stored using the Service. You acknowledge that you store content at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
            <p className="mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL LATERLOCK, ITS CREATORS, OPERATORS, OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL DAMAGES, OR ANY DAMAGES WHATSOEVER INCLUDING, WITHOUT LIMITATION, DAMAGES FOR LOSS OF USE, DATA, OR PROFITS, ARISING OUT OF OR IN ANY WAY CONNECTED WITH THE USE OR PERFORMANCE OF THE SERVICE.
            </p>
            <p>
              You specifically acknowledge that LaterLock shall not be liable for user content or the defamatory, offensive, or illegal conduct of any third party and that the risk of harm or damage from the foregoing rests entirely with you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless LaterLock, its creators, operators, and contributors from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney&apos;s fees) arising from your use of the Service, your violation of any term of these Terms of Service, or your violation of any rights of a third party.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Modifications to Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms of Service at any time. It is your responsibility to check these Terms periodically for changes. Your continued use of the Service following the posting of any changes constitutes acceptance of those changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us through our GitHub repository.
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link href="/" className="text-primary hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    </main>
  );
} 