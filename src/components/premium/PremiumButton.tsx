import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePremium } from "@/hooks/usePremium";
import { useState } from "react";
import { PremiumModal } from "./PremiumModal";

export function PremiumButton() {
  const { isPremium } = usePremium();
  const [showModal, setShowModal] = useState(false);

  if (isPremium) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-gradient-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-accent">
        <Crown className="h-4 w-4" />
        <span>Premium</span>
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        className="animate-pulse-glow gap-2 bg-gradient-accent text-accent-foreground shadow-accent hover:opacity-90"
      >
        <Crown className="h-4 w-4" />
        <span className="hidden sm:inline">Go Premium</span>
        <span className="sm:hidden">Premium</span>
      </Button>
      <PremiumModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
}
