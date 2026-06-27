import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/layout/ContentPage";
import { COMPANY_NAME, SITE_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Contact — ${SITE_NAME}`,
  description: `Get in touch with the ${SITE_NAME} team.`,
};

export default function ContactPage() {
  return (
    <ContentPage
      title="Contact"
      description="We're here to help with membership, borrowing, and author enquiries."
    >
      <section className="space-y-4">
        <h2>General support</h2>
        <p>
          For help with sign-in, borrowing, or offline reading, members should first sign in and
          check the <Link href="/books">catalog</Link> and{" "}
          <Link href="/borrow-policy">borrowing policy</Link>.
        </p>
        <p>
          Platform operator: <strong>{COMPANY_NAME}</strong>
        </p>
      </section>

      <section className="space-y-4">
        <h2>Authors</h2>
        <p>
          Authors with upload or earnings questions can sign in and visit the author dashboard.
          New author accounts are provisioned by platform administrators.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Privacy and legal</h2>
        <p>
          For privacy requests, see our <Link href="/privacy">privacy policy</Link>. For platform
          rules, see <Link href="/terms">terms of service</Link>.
        </p>
      </section>

      <section className="rounded-xl border border-stone-200 bg-stone-50 p-6">
        <h2 className="text-lg font-semibold text-stone-900">Email</h2>
        <p className="mt-2">
          <a href="mailto:support@ebooks.lk" className="font-medium text-amber-800 hover:underline">
            support@ebooks.lk
          </a>
        </p>
        <p className="mt-2 text-sm text-stone-600">
          Replace with your production support address when ready. Response times may vary by
          enquiry type.
        </p>
      </section>
    </ContentPage>
  );
}
