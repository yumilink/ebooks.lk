import type { Role, SubscriptionStatus } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      subscriptionStatus: SubscriptionStatus;
      subscriptionExpiry: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    subscriptionStatus: SubscriptionStatus;
    subscriptionExpiry: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    subscriptionStatus: SubscriptionStatus;
    subscriptionExpiry: string | null;
  }
}
