import LegalPageLayout from "@/components/LegalPageLayout";

export const metadata = {
  title: "Terms of Service | Originly",
  description: "Draft terms of service for Originly by NagTech Labs.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description="These draft terms cover your use of Originly, including capturing, verifying, and sharing ideas and making Pi payments."
    >
      <section>
        <h2 className="heading-3">1. About these terms</h2>
        <p className="mt-3">
          Originly is operated by NagTech Labs (&quot;NagTech Labs,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) in the Philippines.
          By accessing or using Originly, you agree to these Terms and our{" "}
          <a className="underline underline-offset-4" href="/privacy">
            Privacy Policy
          </a>
          . If you do not agree, do not use the service. If you are not legally able to enter into a binding
          agreement, use Originly only with permission and supervision from a parent or legal guardian.
        </p>
      </section>

      <section>
        <h2 className="heading-3">2. What Originly does—and does not do</h2>
        <p className="mt-3">
          Originly lets you save ideas, generate a content fingerprint, keep versions, and optionally share records.
          A fingerprint can help compare content submitted to the app; it is not a copyright registration, legal
          opinion, independent timestamping service, or guarantee of authorship, ownership, priority, or legal
          protection. You are responsible for obtaining any registrations or professional advice you need.
        </p>
      </section>

      <section>
        <h2 className="heading-3">3. Your account</h2>
        <p className="mt-3">
          You must provide accurate sign-in information, protect access to your account, and promptly tell us if you
          believe it has been compromised. You are responsible for activity through your account, except where
          applicable law provides otherwise. We may suspend access when reasonably necessary to protect users,
          investigate misuse, or comply with law.
        </p>
      </section>

      <section>
        <h2 className="heading-3">4. Your content and sharing</h2>
        <p className="mt-3">
          You retain whatever rights you have in content you submit. You confirm that you created it or have the
          rights and permissions needed to submit, store, and share it as you choose. You grant NagTech Labs a
          limited, non-exclusive permission to host, reproduce, process, and display that content only as needed to
          operate, secure, and provide the features you use, including sharing and verification.
        </p>
        <p className="mt-3">
          Content you make public or share by link may be seen, copied, or redistributed by others. Do not share
          confidential, personal, or third-party material unless you have the authority and intend that disclosure.
          You are responsible for your content and your visibility choices.
        </p>
      </section>

      <section>
        <h2 className="heading-3">5. Acceptable use</h2>
        <p className="mt-3">You must not use Originly to:</p>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>violate law or rights held by others, including intellectual-property or privacy rights;</li>
          <li>upload malicious code, abuse the service, or attempt unauthorized access;</li>
          <li>misrepresent authorship, manipulate proof or payment records, or interfere with verification; or</li>
          <li>use shared content in a way that violates the rights of its owner or applicable law.</li>
        </ul>
      </section>

      <section>
        <h2 className="heading-3">6. Pi payments</h2>
        <p className="mt-3">
          Some idea submissions require a Pi payment. The price shown in the app before payment is the price for
          that submission; prices and features may change for future submissions. Payments are initiated and
          processed through Pi Network and are subject to the applicable Pi Network terms, network availability, and
          transaction rules. You authorize the payment when you confirm it in Pi. Network delays or fees may apply.
        </p>
        <p className="mt-3">
          A submission is not treated as paid until the app verifies the payment. If a payment appears to have been
          charged but the app does not confirm it, contact us with the payment reference—never send a wallet
          passphrase or private key. Refunds or corrections will be handled as required by applicable law and the
          circumstances of the transaction.
        </p>
      </section>

      <section>
        <h2 className="heading-3">7. Third-party services</h2>
        <p className="mt-3">
          Originly relies on services such as Firebase, Supabase, Google, Pi Network, OpenStreetMap Nominatim, and
          our hosting provider. Their services may be subject to separate terms, outages, or changes. We do not
          control third-party services and are not responsible for their independent operation or policies.
        </p>
      </section>

      <section>
        <h2 className="heading-3">8. Availability and changes</h2>
        <p className="mt-3">
          We aim to keep Originly available but do not promise uninterrupted or error-free service. We may modify,
          suspend, or discontinue features, and may restrict access for security, maintenance, misuse, or legal
          reasons. We will handle changes and notices as required by applicable law.
        </p>
      </section>

      <section>
        <h2 className="heading-3">9. Disclaimers</h2>
        <p className="mt-3">
          To the extent permitted by law, Originly is provided &quot;as is&quot; and &quot;as available.&quot; We do not warrant
          that stored content will always be available, that a fingerprint will be accepted as evidence by any
          person or authority, or that using Originly will establish or protect intellectual-property rights. These
          terms do not limit rights or remedies that cannot lawfully be excluded.
        </p>
      </section>

      <section>
        <h2 className="heading-3">10. Liability</h2>
        <p className="mt-3">
          Nothing in these terms excludes or limits liability where doing so is prohibited by law. Subject to that
          rule, NagTech Labs is not responsible for indirect or consequential loss arising from use of Originly,
          third-party services, or content shared by users. Any limitation applies only to the extent permitted by
          applicable law.
        </p>
      </section>

      <section>
        <h2 className="heading-3">11. Philippine law and contact</h2>
        <p className="mt-3">
          These terms are governed by the laws of the Philippines, without limiting any mandatory consumer
          protections that apply to you. For questions, complaints, or legal notices, email{" "}
          <a className="underline underline-offset-4" href="mailto:thomasadriannaguit@gmail.com">
            thomasadriannaguit@gmail.com
          </a>{" "}
          or{" "}
          <a className="underline underline-offset-4" href="mailto:tomtonjon@yahoo.com">
            tomtonjon@yahoo.com
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="heading-3">12. Updates</h2>
        <p className="mt-3">
          We may revise these terms as Originly changes. The updated date above identifies the latest revision.
          Continued use after a revision takes effect is subject to applicable notice and consent requirements.
        </p>
      </section>
    </LegalPageLayout>
  );
}
