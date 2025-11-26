// src/app/privacy/page.tsx

export const metadata = {
  title: "Privacy Policy • Wavv",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight mb-4">
          Privacy Policy
        </h1>
        <p className="text-xs text-gray-400 mb-8">
          Last updated: November 26, 2025
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-gray-200">
          <p>
            Wavv (“we”, “us”, or “our”) respects your privacy. This Privacy
            Policy explains how we collect, use, and protect your information
            when you use Wavv (“the Service”).
          </p>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              1. Information We Collect
            </h2>

            <h3 className="font-semibold mt-3">A. Information You Provide</h3>
            <p className="mt-1">
              We may collect information that you provide directly, including:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Name or display name</li>
              <li>Email address</li>
              <li>Creator profile details such as handle and bio</li>
              <li>Connected account usernames</li>
              <li>Your preferences and settings</li>
            </ul>

            <h3 className="font-semibold mt-4">
              B. Information Collected Automatically
            </h3>
            <p className="mt-1">
              When you use Wavv, we may automatically collect:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Device and browser information</li>
              <li>IP address and approximate region</li>
              <li>Usage activity within the Service</li>
              <li>Timezone, locale, and language preferences</li>
            </ul>

            <h3 className="font-semibold mt-4">
              C. Connected Platform Data (e.g., TikTok)
            </h3>
            <p className="mt-1">
              If you choose to connect your social accounts (such as TikTok), we
              may access data made available by those platforms, including:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Public profile information (username, avatar, bio)</li>
              <li>Follower counts and aggregate engagement metrics</li>
              <li>
                Post-level metrics such as views, likes, comments, shares,
                saves, and posting dates
              </li>
              <li>
                Other analytics fields exposed by the platform&apos;s official
                APIs that are necessary to provide Wavv&apos;s analytics
              </li>
            </ul>
            <p className="mt-2">
              We do <strong>not</strong> access your passwords, private
              messages, or content that is not available through the official
              APIs you authorize.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              2. How We Use Your Information
            </h2>
            <p>We use the information we collect to:</p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Provide analytics, dashboards, and performance insights</li>
              <li>Generate personalized content and strategy recommendations</li>
              <li>Improve the accuracy and usefulness of Wavv</li>
              <li>
                Maintain and secure the Service, including fraud prevention and
                abuse detection
              </li>
              <li>
                Communicate with you about important changes, updates, or
                support issues
              </li>
            </ul>
            <p className="mt-2">
              We do <strong>not</strong> sell your personal information to third
              parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              3. Legal Bases for Processing
            </h2>
            <p>
              Where required by law (such as under GDPR), we process your
              personal data based on one or more of the following legal bases:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Your consent (for example, when you connect a TikTok account)</li>
              <li>Performance of a contract (providing the Service)</li>
              <li>Legitimate interests (such as improving and securing Wavv)</li>
              <li>Compliance with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              4. Data Sharing and Third Parties
            </h2>
            <p>
              We may share your information with third parties only in limited
              situations:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>
                <span className="font-semibold">Connected platforms:</span> When
                you link a platform like TikTok, your data is exchanged with
                that platform according to their permissions and policies.
              </li>
              <li>
                <span className="font-semibold">Service providers:</span>{" "}
                Infrastructure, hosting, analytics, and database providers that
                help us operate Wavv (for example, Supabase and similar tools).
              </li>
              <li>
                <span className="font-semibold">Legal requirements:</span> If we
                are required to do so by law, regulation, or valid legal
                process.
              </li>
            </ul>
            <p className="mt-2">
              We do not sell or rent your information to advertisers or data
              brokers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Data Storage</h2>
            <p>
              We store data using industry-standard security practices,
              including encryption in transit and access controls on our
              database. Data is stored for as long as necessary to provide the
              Service, comply with legal obligations, or resolve disputes.
            </p>
            <p className="mt-2">
              If you request deletion of your account or connected data, we will
              remove or anonymize your personal information where technically
              feasible and legally permitted.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              6. Your Rights and Choices
            </h2>
            <p>
              Depending on your location, you may have rights under laws such as
              the GDPR, CCPA/CPRA, or LGPD, including:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Accessing the personal data we hold about you</li>
              <li>Correcting inaccurate or incomplete data</li>
              <li>Requesting deletion of your data</li>
              <li>Objecting to or restricting certain processing</li>
              <li>Exporting your data in a portable format</li>
            </ul>
            <p className="mt-2">
              You can revoke platform permissions at any time by disconnecting
              your social accounts or adjusting settings on the original
              platform (for example, TikTok&apos;s developer settings).
            </p>
            <p className="mt-2">
              To exercise your rights, contact us at{" "}
              <a
                href="mailto:wavv.support@gmail.com"
                className="underline text-gray-100"
              >
                wavv.support@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Cookies</h2>
            <p>
              Wavv may use cookies or similar technologies to support
              authentication, session management, analytics, and preference
              storage. You can configure your browser to reject cookies, but
              some features of the Service may not function properly if cookies
              are disabled.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              8. Children&apos;s Privacy
            </h2>
            <p>
              Wavv is not directed to children under 13 years of age or the
              minimum age required by the laws of your country. We do not
              knowingly collect personal information from children. If you
              believe a child has provided us with personal information, please
              contact us so we can take appropriate action.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              9. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. When we make
              changes, we will update the “Last updated” date at the top of this
              page. Your continued use of Wavv after changes are posted
              indicates your acceptance of the revised Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">10. Contact</h2>
            <p>
              If you have questions about this Privacy Policy or how we handle
              your data, you can contact us at:
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
