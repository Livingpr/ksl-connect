import { motion, AnimatePresence } from "framer-motion";
import { Hand, Crown } from "lucide-react";

interface TwoHandOverlayProps {
  isTwoHanded: boolean;
  isPremium: boolean;
  handDetected: boolean;
}

export const TwoHandOverlay = ({
  isTwoHanded,
  isPremium,
  handDetected,
}: TwoHandOverlayProps) => {
  return (
    <AnimatePresence>
      {isTwoHanded && handDetected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="absolute left-1/2 top-4 z-30 -translate-x-1/2"
        >
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium backdrop-blur-sm shadow-lg ${
              isPremium
                ? "bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground two-hands-active"
                : "bg-accent/90 text-accent-foreground"
            }`}
          >
            <div className="flex items-center gap-1">
              <Hand className="h-4 w-4" />
              <Hand className="h-4 w-4 -scale-x-100" />
            </div>
            <span>
              {isPremium ? "Two-Handed Mode Active" : "Premium Required"}
            </span>
            {isPremium && <Crown className="h-4 w-4" />}
          </div>
        </motion.div>
      )}

      {/* Hand Labels Overlay */}
      {isTwoHanded && isPremium && (
        <>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2"
          >
            <div className="rounded-lg bg-success/90 px-3 py-1.5 text-xs font-bold text-success-foreground shadow-md">
              LEFT
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2"
          >
            <div className="rounded-lg bg-primary/90 px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-md">
              RIGHT
            </div>
          </motion.div>
        </>
      )}

      {/* Border glow for two-handed mode */}
      {isTwoHanded && isPremium && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            boxShadow:
              "inset 0 0 20px hsl(var(--primary) / 0.3), inset 0 0 40px hsl(var(--primary) / 0.1)",
          }}
        />
      )}
    </AnimatePresence>
  );
};
