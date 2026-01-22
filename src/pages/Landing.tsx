import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, History, Volume2, WifiOff, Hand, ArrowRight, LogIn } from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Real-Time Translation",
    description: "Instant KSL gesture recognition with confidence scores.",
  },
  {
    icon: Volume2,
    title: "Text-to-Speech",
    description: "Hear translations in English or Swahili.",
  },
  {
    icon: History,
    title: "Translation History",
    description: "Save, search, and export your translations.",
  },
  {
    icon: WifiOff,
    title: "Works Offline",
    description: "Full functionality without internet.",
  },
];

const howItWorks = [
  { step: 1, title: "Point Camera", description: "Show your KSL gestures" },
  { step: 2, title: "AI Detects", description: "Hand positions recognized" },
  { step: 3, title: "Get Translation", description: "See and hear the result" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header - 56px */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg safe-area-top">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <Hand className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold">KSL</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth?mode=register">
              <Button variant="hero" size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Optimized for 720×1600 */}
      <section className="px-4 py-8 md:py-12">
        <div className="mx-auto max-w-lg text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs text-accent">
              <WifiOff className="h-3 w-3" />
              <span>Works 100% Offline</span>
            </div>
            <h1 className="mb-4 font-heading text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              Real-Time{" "}
              <span className="text-gradient-primary">KSL Translation</span>
            </h1>
            <p className="mx-auto mb-6 max-w-sm text-sm text-muted-foreground sm:text-base">
              Break communication barriers with AI-powered Kenyan Sign Language translation.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/auth?mode=register" className="w-full sm:w-auto">
                <Button variant="hero" size="lg" className="w-full">
                  Start Translating
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth" className="w-full sm:w-auto">
                <Button variant="hero-outline" size="lg" className="w-full">
                  I have an account
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Hero Visual - Compact */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative mt-8"
          >
            <div className="relative mx-auto aspect-[4/3] max-w-xs overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-card">
                <div className="text-center">
                  <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary animate-pulse-slow">
                    <Camera className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Camera Preview
                  </p>
                </div>
              </div>
              {/* Decorative points */}
              <div className="absolute left-1/4 top-1/3 h-2 w-2 rounded-full bg-success/60 animate-pulse" />
              <div className="absolute right-1/3 top-1/4 h-2 w-2 rounded-full bg-success/60 animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Compact Grid */}
      <section className="border-y border-border/40 bg-card/50 py-8">
        <div className="px-4">
          <h2 className="mb-6 text-center font-heading text-xl font-bold sm:text-2xl">
            Features
          </h2>
          <div className="mx-auto grid max-w-lg grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="rounded-lg border border-border bg-card p-3"
              >
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-4 w-4" />
                </div>
                <h3 className="mb-1 font-heading text-sm font-semibold">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-tight">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Horizontal */}
      <section className="py-8">
        <div className="px-4">
          <h2 className="mb-6 text-center font-heading text-xl font-bold sm:text-2xl">
            How It Works
          </h2>
          <div className="mx-auto flex max-w-lg justify-center gap-4">
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex-1 text-center"
              >
                <div className="mb-2 mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary font-heading text-sm font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mb-1 font-heading text-xs font-semibold sm:text-sm">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-tight">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Compact */}
      <section className="border-t border-border/40 bg-gradient-primary py-8">
        <div className="px-4 text-center">
          <h2 className="mb-3 font-heading text-xl font-bold text-primary-foreground sm:text-2xl">
            Ready to Start?
          </h2>
          <p className="mx-auto mb-5 max-w-xs text-sm text-primary-foreground/80">
            Join users making sign language accessible.
          </p>
          <Link to="/auth?mode=register">
            <Button variant="accent" size="lg" className="shadow-glow">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer - Compact */}
      <footer className="border-t border-border bg-card py-4 safe-area-bottom">
        <div className="flex flex-col items-center gap-2 px-4 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-primary">
              <Hand className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-heading font-semibold text-foreground">KSL Translator</span>
          </div>
          <p>© 2024 Making sign language accessible.</p>
        </div>
      </footer>
    </div>
  );
}
