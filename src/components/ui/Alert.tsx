import { cn } from "@/lib/cn";

export function Alert({
  variant = "info",
  children,
  className,
}: {
  variant?: "info" | "success" | "error" | "warning";
  children: React.ReactNode;
  className?: string;
}) {
  const styles = {
    info: "border-stone-200 bg-stone-50 text-stone-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
  };

  return (
    <div className={cn("rounded-lg border px-4 py-3 text-sm", styles[variant], className)}>
      {children}
    </div>
  );
}
