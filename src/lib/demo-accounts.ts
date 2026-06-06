/** Demo login is development-only — never enabled in production builds. */
export function isDemoLoginEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

export const demoAccounts = [
  {
    email: "member@ebooks.lk",
    name: "Demo Member",
    role: "MEMBER" as const,
    description: "Borrow and read books",
  },
  {
    email: "author@ebooks.lk",
    name: "Demo Author",
    role: "AUTHOR" as const,
    description: "Upload books & view earnings",
  },
  {
    email: "admin@ebooks.lk",
    name: "Platform Admin",
    role: "ADMIN" as const,
    description: "Platform settings & full access",
  },
];

/** Local dev only — matches SEED_DEMO_PASSWORD used by prisma/seed.ts */
export function getDemoPassword(): string {
  return process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "changeme123";
}
