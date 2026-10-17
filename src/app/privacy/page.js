import LegalPageLayout from "@/components/LegalPageLayout";

export const metadata = {
  title: "Privacy Policy | Originly",
  description: "Draft privacy policy for Originly by NagTech Labs.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="This draft explains how NagTech Labs handles information when you use Originly to capture, store, verify, and share ideas."
    >
      <section>
        <h2 className="heading-3">1. Who we are</h2>
        <p className="mt-3">
          Originly is operated by NagTech Labs (&quot;NagTech Labs,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). For privacy questions
          or requests, contact either email address listed at the end of this policy.
        </p>
      </section>

      <section>
        <h2 className="heading-3">2. Information we handle</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>
            <strong>Account information:</strong> Firebase user identifiers and sign-in information. Google sign-in
            may provide your name, email address, and profile information; Pi sign-in may provide your Pi user
            identifier and username, subject to the permissions you grant.
          </li>
          <li>
            <strong>Ideas and versions:</strong> titles, text, categories, tags, timestamps, visibility choices,
            version history, and related account identifiers that you submit or edit.
          </li>
          <li>
            <strong>Media:</strong> files you choose to upload or record, plus file names, types, sizes, and storage
            references. Media is uploaded to the configured Supabase Storage bucket. The app obtains public URLs for
            uploaded files; access depends on the configured bucket settings. Do not upload sensitive files unless you
            have checked the storage access settings.
          </li>
          <li>
            <strong>Optional location:</strong> if you choose to capture GPS location, the app uses your device
            coordinates and may send them to the OpenStreetMap Nominatim service to look up a place name. Location can
            be saved with an idea and included when you share that idea.
          </li>
          <li>
            <strong>Payment records:</strong> Pi payment identifiers, transaction identifiers, amount, product,
            status, and account identifiers used to verify and associate an idea-submission payment. Pi processes
            the payment through its own platform.
          </li>
          <li>
            <strong>Technical and preference data:</strong> request metadata such as IP address may be used by the
            server for rate limiting and security. The selected theme is saved in your browser local storage.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="heading-3">3. How we use information</h2>
        <p className="mt-3">
          We use information to authenticate users, provide the idea vault and verification features, store and
          display submitted content, create share links, process and verify Pi payments, maintain service security,
          respond to requests, and meet applicable legal obligations. We do not use your private ideas to claim
          ownership of them.
        </p>
      </section>

      <section>
        <h2 className="heading-3">4. Private and shared content</h2>
        <p className="mt-3">
          Ideas are associated with your account. When you intentionally create a share link or publish content to
          community features, the shared copy may be available to other people and may show your chosen display name,
          idea content, and any location or media included with it. Anyone with a share URL may be able to view the
          shared record. Changing visibility or asking us to remove content cannot retrieve copies that other people
          have already saved or redistributed.
        </p>
      </section>

      <section>
        <h2 className="heading-3">5. Service providers and disclosures</h2>
        <p className="mt-3">
          We use third-party services to operate Originly, including Firebase for authentication and database
          services, Supabase for file storage, Vercel or our configured hosting provider to serve the app, Google for
          Google sign-in, Pi Network for Pi authentication and payments, and OpenStreetMap Nominatim when you request
          a location lookup. Those providers process information as needed to provide their services and under their
          own terms and privacy notices. Information may be processed in countries outside the Philippines.
        </p>
        <p className="mt-3">
          We may also disclose information where reasonably necessary to protect users or the service, respond to
          lawful requests, enforce our terms, or complete a corporate transaction, subject to applicable law.
        </p>
      </section>

      <section>
        <h2 className="heading-3">6. Retention and your choices</h2>
        <p className="mt-3">
          We retain information for as long as needed to operate Originly, maintain payment and security records, and
          meet legal obligations. The app may not provide a self-service account or content deletion control. You may
          request access, correction, or deletion by emailing us; we will review and respond subject to identity
          verification, applicable law, and records we are required or permitted to retain. Copies in backups or
          already-shared content may remain for a limited period or outside our control.
        </p>
        <p className="mt-3">
          You can decline optional location access, avoid sharing an idea, sign out, and manage Google or Pi
          permissions through those providers. Some service features may not work without required account or
          payment information.
        </p>
      </section>

      <section>
        <h2 className="heading-3">7. Security</h2>
        <p className="mt-3">
          We use service-provider security controls and reasonable measures intended to protect information.
          Internet transmission and storage are not guaranteed to be completely secure; use care when choosing what
          to submit or share.
        </p>
      </section>

      <section>
        <h2 className="heading-3">8. Philippine privacy rights</h2>
        <p className="mt-3">
          If the Philippine Data Privacy Act of 2012 applies to our processing, you may have rights as a data
          subject, including rights to be informed, access and correct personal information, object to or request
          blocking or deletion in applicable circumstances, and lodge a complaint with the National Privacy
          Commission. Contact us first so we can assess and respond to your request. Rights and exceptions depend on
          the circumstances and applicable law.
        </p>
      </section>

      <section>
        <h2 className="heading-3">9. Children</h2>
        <p className="mt-3">
          Originly is not designed for children who are not legally able to consent to this processing. A parent or
          legal guardian who believes a child provided personal information may contact us to request review and
          appropriate action.
        </p>
      </section>

      <section>
        <h2 className="heading-3">10. Changes and contact</h2>
        <p className="mt-3">
          We may update this policy as the service changes. We will update the date above when we do. For questions
          or privacy requests, email{" "}
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
    </LegalPageLayout>
  );
}
