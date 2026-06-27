import Link from "next/link";
import { SITE_NAME } from "@/lib/brand";
import { cn } from "@/lib/cn";

interface SiteLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl sm:text-3xl",
};

export function SiteLogo({ className, size = "md" }: SiteLogoProps) {
  const [name, tld] = SITE_NAME.split(".");

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-baseline font-bold tracking-tight text-stone-900",
        sizeClasses[size],
        className
      )}
      aria-label={SITE_NAME}
    >
      <span>{name}</span>
      <span className="text-amber-700">.{tld}</span>
    </Link>
  );
}
