import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/layout/ContentPage";
import { SITE_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Borrowing policy — ${SITE_NAME}`,
  description: `How borrowing, offline access, and expiry work on ${SITE_NAME}.`,
};

export default function BorrowPolicyPage() {
  return (
    <ContentPage
      title="Borrowing policy"
      description="How library-style borrows and offline reading work on our platform."
    >
      <section className="space-y-4">
        <h2>Library-style borrows</h2>
        <p>
          {SITE_NAME} uses a borrowing model — not permanent purchases. When you borrow a title,
          you receive access for a fixed period (currently seven days from the borrow date).
        </p>
      </section>

      <section className="space-y-4">
        <h2>Offline access</h2>
        <ul>
          <li>After borrowing online, the book is encrypted and stored locally on your device.</li>
          <li>You may read without an internet connection until the borrow expires.</li>
          <li>When the period ends, local copies are invalidated and you must borrow again online.</li>
          <li>Installing the {SITE_NAME} app (PWA) improves offline reliability on mobile devices.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>Membership</h2>
        <p>
          An active membership is required to borrow new titles. Expired memberships cannot start
          new borrows until renewed. Previously downloaded copies remain governed by the borrow
          expiry date, not membership status alone — see check-in rules in the reader.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Acceptable use</h2>
        <p>While reading a borrowed book you must not:</p>
        <ul>
          <li>Extract, share, or redistribute EPUB files or decrypted content.</li>
          <li>Circumvent technical protection or borrow limits.</li>
          <li>Use automated tools to scrape or bulk-download catalogue data.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>Questions</h2>
        <p>
          For support with borrows or offline reading, see <Link href="/contact">contact</Link> or
          sign in and browse the <Link href="/books">catalog</Link>.
        </p>
      </section>
    </ContentPage>
  );
}
