export const DEMO_PASSWORD = "changeme123";

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
