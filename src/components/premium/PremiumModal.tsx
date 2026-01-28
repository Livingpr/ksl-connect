import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Crown, Hand, Zap, TrendingUp, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const features = [
  {
    icon: Hand,
    title: "Two-Handed Detection",
    description: "Unlock complex two-handed signs like THANK YOU, SORRY, HELP",
  },
  {
    icon: Zap,
    title: "100+ Signs Vocabulary",
    description: "Access expanded sign library beyond the free 50 signs",
  },
  {
    icon: TrendingUp,
    title: "Advanced Analytics",
    description: "Weekly reports, accuracy trends, and progress insights",
  },
  {
    icon: Star,
    title: "Priority Support",
    description: "Get help faster with dedicated premium support",
  },
];

const plans = [
  {
    id: "monthly",
    name: "Monthly",
    price: "$4.99",
    period: "/month",
    savings: null,
  },
  {
    id: "yearly",
    name: "Annual",
    price: "$39.99",
    period: "/year",
    savings: "Save 33%",
  },
];

export function PremiumModal({ open, onOpenChange }: PremiumModalProps) {
  const { updateProfile } = useAuth();

  const handleSubscribe = (planId: string) => {
    // Mock subscription - in production would integrate with Stripe
    updateProfile({
      isPremium: true,
      subscriptionStatus: planId === "yearly" ? "premium_yearly" : "premium_monthly",
      subscriptionExpiry: new Date(Date.now() + (planId === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000),
    });
    toast.success("Welcome to Premium! 🎉", {
      description: "You now have access to all premium features.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-accent shadow-accent">
            <Crown className="h-6 w-6 text-accent-foreground" />
          </div>
          <DialogTitle className="text-center font-heading text-2xl">
            Upgrade to Premium
          </DialogTitle>
          <DialogDescription className="text-center">
            Unlock the full power of KSL Translator
          </DialogDescription>
        </DialogHeader>

        {/* Features */}
        <div className="mt-4 space-y-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{feature.title}</p>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => handleSubscribe(plan.id)}
              className="group relative rounded-xl border-2 border-border bg-card p-4 text-left transition-all hover:border-accent hover:shadow-lg"
            >
              {plan.savings && (
                <span className="absolute -top-2 right-3 rounded-full bg-success px-2 py-0.5 text-xs font-semibold text-success-foreground">
                  {plan.savings}
                </span>
              )}
              <p className="font-medium">{plan.name}</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-heading text-2xl font-bold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground">
                <Check className="h-3 w-3 text-success" />
                All premium features
              </div>
            </button>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Cancel anytime. Secure payment powered by Stripe.
        </p>
      </DialogContent>
    </Dialog>
  );
}
