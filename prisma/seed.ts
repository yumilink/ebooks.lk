import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const plainPassword = process.env.SEED_DEMO_PASSWORD ?? "changeme123";
  const password = await bcrypt.hash(plainPassword, 12);
  const subscriptionExpiry = new Date("2099-12-31");

  const userDefaults = {
    password,
    subscriptionStatus: "ACTIVE" as const,
    subscriptionExpiry,
  };

  const admin = await prisma.user.upsert({
    where: { email: "admin@ebooks.lk" },
    update: { ...userDefaults, name: "Platform Admin", role: "ADMIN" },
    create: {
      email: "admin@ebooks.lk",
      name: "Platform Admin",
      role: "ADMIN",
      ...userDefaults,
    },
  });

  const author = await prisma.user.upsert({
    where: { email: "author@ebooks.lk" },
    update: { ...userDefaults, name: "Demo Author", role: "AUTHOR" },
    create: {
      email: "author@ebooks.lk",
      name: "Demo Author",
      role: "AUTHOR",
      ...userDefaults,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@ebooks.lk" },
    update: { ...userDefaults, name: "Demo Member", role: "MEMBER" },
    create: {
      email: "member@ebooks.lk",
      name: "Demo Member",
      role: "MEMBER",
      ...userDefaults,
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: "base_payout_rate_per_minute" },
    update: {},
    create: {
      key: "base_payout_rate_per_minute",
      value: "0.05",
    },
  });

  console.log("Seeded:", { admin: admin.email, author: author.email, member: member.email });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
