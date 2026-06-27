import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/layout/ContentPage";
import { COMPANY_NAME, SITE_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Terms of service — ${SITE_NAME}`,
  description: `Terms governing use of ${SITE_NAME}.`,
};

export default function TermsPage() {
  return (
    <ContentPage
      title="Terms of service"
      description="By using this platform you agree to the following terms."
    >
      <section className="space-y-4">
        <h2>Acceptance</h2>
        <p>
          These terms apply to all visitors and registered users of {SITE_NAME}, operated by{" "}
          {COMPANY_NAME}. If you do not agree, please do not use the service.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Membership and accounts</h2>
        <ul>
          <li>You must provide accurate registration information and keep credentials secure.</li>
          <li>Accounts are personal; sharing login details is not permitted.</li>
          <li>We may suspend accounts that violate these terms or applicable law.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>Content and borrowing</h2>
        <p>
          EPUB titles remain the property of their authors or rights holders. Borrowing grants a
          limited, time-bound licence to read — not to copy, redistribute, or strip protection.
          See our <Link href="/borrow-policy">borrowing policy</Link> for details.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Authors</h2>
        <p>
          Authors represent that they have the right to upload content and grant the platform a
          licence to host and deliver it to eligible members. Earnings figures displayed on the
          dashboard are estimates unless otherwise stated in a separate agreement.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Disclaimer</h2>
        <p>
          The service is provided &quot;as is&quot; to the extent permitted by law. We strive for
          availability and security but do not guarantee uninterrupted access.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Contact</h2>
        <p>
          Questions about these terms? Visit our <Link href="/contact">contact page</Link>.
        </p>
      </section>
    </ContentPage>
  );
}
