'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface BookDemoButtonProps {
  className?: string;
  label?: string;
}

export function BookDemoButton({ className, label = "Book a Demo" }: BookDemoButtonProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    router.prefetch("/contact");
  }, [router]);

  const handleNavigate = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.push("/contact");
  };

  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed";
  const mergedClasses = [baseClasses, className].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      onClick={handleNavigate}
      disabled={isNavigating}
      className={mergedClasses}
      aria-busy={isNavigating}
    >
      {isNavigating && <Loader2 className="h-5 w-5 animate-spin" />}
      <span>{label}</span>
    </button>
  );
}

