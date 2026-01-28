import { Crown } from "lucide-react";
import { usePremium } from "@/hooks/usePremium";

interface PremiumBadgeProps {
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function PremiumBadge({ size = "sm", showLabel = true }: PremiumBadgeProps) {
  const { isPremium } = usePremium();

  if (!isPremium) return null;

  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const padding = size === "sm" ? "px-2 py-0.5" : "px-3 py-1";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-accent ${padding} ${textSize} font-semibold text-accent-foreground`}
    >
      <Crown className={iconSize} />
      {showLabel && <span>Premium</span>}
    </div>
  );
}
