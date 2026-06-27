import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/ContentPage";
import { COMPANY_NAME, SITE_DESCRIPTION, SITE_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `About us — ${SITE_NAME}`,
  description: `Learn about ${SITE_NAME} and our secure library-style ebook platform.`,
};

export default function AboutPage() {
  return (
    <ContentPage
      title="About us"
      description={`${SITE_NAME} is operated by ${COMPANY_NAME} as a secure digital library for EPUB borrowing.`}
    >
      <section className="space-y-4">
        <h2>Our mission</h2>
        <p>
          {SITE_NAME} helps readers discover and borrow ebooks through a library-style model —
          not permanent downloads. Authors retain control of their work while members enjoy a
          modern reading experience, including encrypted offline access for up to seven days per
          borrow.
        </p>
        <p>{SITE_DESCRIPTION}</p>
      </section>

      <section className="space-y-4">
        <h2>What makes us different</h2>
        <ul>
          <li>
            <strong>Library borrowing</strong> — titles are borrowed for a fixed period, similar
            to a physical library.
          </li>
          <li>
            <strong>Offline reading</strong> — borrowed books can be read without an internet
            connection until the borrow expires.
          </li>
          <li>
            <strong>Author support</strong> — reading time and borrows contribute to author
            earnings estimates.
          </li>
          <li>
            <strong>EPUB protection</strong> — content is streamed and decrypted in memory; there
            are no public download links.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>Who we serve</h2>
        <p>
          Members browse and borrow titles. Authors upload EPUBs and track engagement. Administrators
          manage platform settings and access. Each role has clearly defined permissions to keep
          content and accounts secure.
        </p>
      </section>
    </ContentPage>
  );
}
