import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/layout/ContentPage";
import { COMPANY_NAME, SITE_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Privacy policy — ${SITE_NAME}`,
  description: `How ${SITE_NAME} collects, uses, and protects your information.`,
};

export default function PrivacyPage() {
  return (
    <ContentPage
      title="Privacy policy"
      description="Last updated: June 2026. This policy describes how we handle personal data on the platform."
    >
      <section className="space-y-4">
        <h2>Who we are</h2>
        <p>
          {SITE_NAME} is operated by {COMPANY_NAME}. For privacy enquiries, please use our{" "}
          <Link href="/contact">contact page</Link>.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Information we collect</h2>
        <ul>
          <li>Account details such as email, name, and role (member, author, or admin).</li>
          <li>Borrow and reading activity, including progress and session duration for library features.</li>
          <li>Technical data such as browser type and security logs required to operate the service.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>How we use your data</h2>
        <p>We use collected information to:</p>
        <ul>
          <li>Authenticate users and enforce membership and borrow rules.</li>
          <li>Provide offline borrowing, reading progress sync, and expiry enforcement.</li>
          <li>Calculate author earnings estimates based on aggregated reading activity.</li>
          <li>Maintain platform security and prevent abuse.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>Local storage and offline data</h2>
        <p>
          When you borrow a book, encrypted EPUB data may be stored in your browser (IndexedDB)
          until the borrow expires. Decryption happens in memory only while you read. You can clear
          this data by removing site data for {SITE_NAME} in your browser or uninstalling the
          installed app.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Data sharing</h2>
        <p>
          We do not sell personal information. Data is shared only when required to operate the
          service (for example hosting providers) or when required by law.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Your rights</h2>
        <p>
          You may request access to or correction of your account information by contacting us.
          Account deletion requests will be handled in line with applicable law and our data
          retention needs for billing and security.
        </p>
      </section>
    </ContentPage>
  );
}
