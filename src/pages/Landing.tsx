import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, History, Volume2, Wifi, WifiOff, Hand, ArrowRight, CheckCircle2 } from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Real-Time Camera Translation",
    description: "Point your camera at KSL gestures and get instant text translation with confidence scores.",
  },
  {
    icon: Volume2,
    title: "Text-to-Speech",
    description: "Hear translations spoken aloud in English or Swahili with adjustable speed and volume.",
  },
  {
    icon: History,
    title: "Translation History",
    description: "Save, search, and favorite your translations. Export to CSV or PDF anytime.",
  },
  {
    icon: WifiOff,
    title: "Works Offline",
    description: "Full translation capability without internet. Your data syncs when you reconnect.",
  },
];

const howItWorks = [
  { step: 1, title: "Point Your Camera", description: "Allow camera access and show your KSL gestures" },
  { step: 2, title: "AI Detects Signs", description: "Our ML model identifies hand positions in real-time" },
  { step: 3, title: "Get Translation", description: "See the text and hear it spoken aloud" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
              <Hand className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold">KSL Translator</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth?mode=register">
              <Button variant="hero">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-accent">
              <Wifi className="h-4 w-4" />
              <span>Works 100% Offline</span>
            </div>
            <h1 className="mb-6 font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Real-Time{" "}
              <span className="text-gradient-primary">Kenyan Sign Language</span>{" "}
              Translation
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Break communication barriers with AI-powered sign language translation. 
              Simply show your gestures to the camera and get instant text and speech output.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/auth?mode=register">
                <Button variant="hero" size="xl">
                  Start Translating Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="hero-outline" size="xl">
                  I Have an Account
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative mt-16"
          >
            <div className="relative mx-auto aspect-video max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-card">
                <div className="text-center">
                  <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary animate-pulse-slow">
                    <Camera className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">
                    Camera Preview Area
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    Sign in to start translating
                  </p>
                </div>
              </div>
              {/* Decorative hand detection points */}
              <div className="absolute left-1/4 top-1/3 h-3 w-3 rounded-full bg-success/60 animate-pulse" />
              <div className="absolute left-1/3 top-1/4 h-3 w-3 rounded-full bg-success/60 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="absolute right-1/3 top-1/3 h-3 w-3 rounded-full bg-success/60 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
            {/* Floating badge */}
            <div className="absolute -right-4 top-8 hidden rounded-lg border border-border bg-card p-4 shadow-lg lg:block">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="font-heading font-semibold">HELLO</p>
                  <p className="text-sm text-muted-foreground">92% confidence</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-y border-border/40 bg-card/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-heading text-3xl font-bold sm:text-4xl">
              Powerful Features
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Everything you need for seamless sign language translation
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-heading text-3xl font-bold sm:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Get started in seconds with our simple 3-step process
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                viewport={{ once: true }}
                className="relative text-center"
              >
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary font-heading text-2xl font-bold text-primary-foreground">
                  {item.step}
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="absolute left-[60%] top-8 hidden h-0.5 w-[80%] bg-gradient-to-r from-primary/50 to-transparent md:block" />
                )}
                <h3 className="mb-2 font-heading text-xl font-semibold">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/40 bg-gradient-primary py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 font-heading text-3xl font-bold text-primary-foreground sm:text-4xl">
            Ready to Break Communication Barriers?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-primary-foreground/80">
            Join thousands of users making sign language accessible to everyone.
          </p>
          <Link to="/auth?mode=register">
            <Button variant="accent" size="xl" className="shadow-glow">
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <Hand className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-semibold text-foreground">KSL Translator</span>
          </div>
          <p>© 2024 KSL Translator. Making sign language accessible.</p>
        </div>
      </footer>
    </div>
  );
}
