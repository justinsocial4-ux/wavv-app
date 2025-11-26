// src/app/terms/page.tsx

export const metadata = {
  title: "Terms of Service • Wavv",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight mb-4">
          Terms of Service
        </h1>
        <p className="text-xs text-gray-400 mb-8">
          Last updated: November 26, 2025
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-gray-200">
          <p>
            Welcome to <strong>Wavv</strong> (“the Service”), operated by Jay
            Hart (“we”, “us”, or “our”). By accessing or using Wavv, you agree
            to be bound by these Terms of Service (“Terms”). If you do not
            agree, please do not use the Service.
          </p>

          <section>
            <h2 className="text-lg font-semibold mb-2">1. Overview</h2>
            <p>
              Wavv is a creator-intelligence and analytics platform that
              provides:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Social media performance insights</li>
              <li>Trend and posting recommendations</li>
              <li>Strategy suggestions and planning tools</li>
              <li>Account connection features using third-party APIs such as TikTok</li>
            </ul>
            <p className="mt-2">
              Wavv is for informational and analytical purposes only. We do not
              guarantee performance improvement, audience growth, or revenue
              outcomes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. Eligibility</h2>
            <p>
              You must be at least 13 years old, or the minimum age required by
              your jurisdiction, to use Wavv. If you connect a third-party
              account (such as TikTok), you represent that you are the
              authorized owner of that account and have the right to grant
              access to Wavv.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your
              login credentials and for all activity that occurs under your
              account. You agree to:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Provide accurate and up-to-date information</li>
              <li>Not impersonate any other person or entity</li>
              <li>
                Notify us promptly at{" "}
                <a
                  href="mailto:wavv.support@gmail.com"
                  className="underline text-gray-100"
                >
                  wavv.support@gmail.com
                </a>{" "}
                if you believe your account has been compromised
              </li>
            </ul>
            <p className="mt-2">
              We may suspend or terminate your account at our discretion if we
              believe you have violated these Terms or are using the Service in
              a harmful or abusive way.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Acceptable Use</h2>
            <p>You agree that you will not:</p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Reverse engineer, decompile, or attempt to access source code</li>
              <li>Bypass or attempt to bypass security or API limits</li>
              <li>
                Use Wavv to harass, harm, or impersonate individuals, brands, or
                organizations
              </li>
              <li>Upload malicious code, scripts, or disruptive content</li>
              <li>
                Use scraped, stolen, or otherwise unauthorized data in
                connection with the Service
              </li>
            </ul>
            <p className="mt-2">
              We may remove content, restrict access, or take other measures if
              we believe your use of Wavv violates these Terms or applicable
              law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              5. Third-Party Platforms
            </h2>
            <p>
              Wavv integrates with third-party services such as TikTok. By
              connecting your accounts, you authorize Wavv to access and process
              the information explicitly permitted by those platforms and by
              your consent.
            </p>
            <p className="mt-2">
              We do not control third-party APIs and are not responsible for:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>API changes or deprecations</li>
              <li>Outages or downtime</li>
              <li>Data limitations or inaccuracies</li>
              <li>Revoked permissions or access tokens</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              6. Intellectual Property
            </h2>
            <p>
              All Wavv branding, design, user interface, content, and strategy
              logic are owned by us or our licensors and are protected by
              intellectual property laws. You may not copy, modify, replicate,
              resell, or create derivative works based on Wavv without our prior
              written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Termination</h2>
            <p>
              We may suspend or terminate your access to Wavv at any time, with
              or without notice, for any reason, including if we reasonably
              believe you have violated these Terms. You may stop using the
              Service at any time by discontinuing use and disconnecting any
              linked accounts.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">8. Disclaimers</h2>
            <p>
              Wavv is provided on an <strong>“as is”</strong> and{" "}
              <strong>“as available”</strong> basis without warranties of any
              kind, whether express or implied. We do not warrant that:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>The Service will be uninterrupted, secure, or error-free</li>
              <li>The data or analytics will be accurate, complete, or current</li>
              <li>
                Recommendations or insights will lead to higher views, growth,
                or revenue
              </li>
              <li>Defects will be corrected promptly or at all</li>
            </ul>
            <p className="mt-2">
              You use Wavv at your own risk. You are solely responsible for any
              decisions you make based on insights or recommendations provided
              by the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              9. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, Wavv and its operators
              shall not be liable for any:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Indirect, incidental, special, or consequential damages</li>
              <li>Loss of profits, revenue, data, or goodwill</li>
              <li>
                Actions or decisions taken by third-party platforms in response
                to your content or account activity
              </li>
            </ul>
            <p className="mt-2">
              In no event shall our total liability to you exceed the amount you
              have paid to use the Service, if any, in the twelve (12) months
              preceding the event giving rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">10. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. When we do, we will
              update the “Last updated” date at the top of this page. Your
              continued use of Wavv after changes are posted constitutes your
              acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">11. Contact</h2>
            <p>
              If you have questions about these Terms, you can contact us at:
            </p>
            <p className="mt-2">
              Email:{" "}
              <a
                href="mailto:wavv.support@gmail.com"
                className="underline text-gray-100"
              >
                wavv.support@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
