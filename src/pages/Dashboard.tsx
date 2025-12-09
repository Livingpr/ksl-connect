import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getStats, getTranslations } from "@/lib/db";
import type { Translation, TranslationStats } from "@/types";
import { 
  Camera, 
  History, 
  Settings, 
  LogOut, 
  Hand, 
  TrendingUp, 
  Target, 
  Flame,
  Clock,
  ChevronRight
} from "lucide-react";

export default function Dashboard() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<TranslationStats>({
    totalSigns: 0,
    avgAccuracy: 0,
    streakDays: 7, // Mock streak for now
    todayCount: 0,
  });
  const [recentTranslations, setRecentTranslations] = useState<Translation[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const loadData = async () => {
      const dbStats = await getStats();
      setStats({
        ...dbStats,
        streakDays: 7, // Mock value
      });
      const recent = await getTranslations(5);
      setRecentTranslations(recent);
    };
    loadData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const statCards = [
    { 
      label: "Total Signs", 
      value: stats.totalSigns, 
      icon: Hand, 
      color: "text-primary",
      bgColor: "bg-primary/10" 
    },
    { 
      label: "Avg Accuracy", 
      value: `${stats.avgAccuracy}%`, 
      icon: Target, 
      color: "text-success",
      bgColor: "bg-success/10" 
    },
    { 
      label: "Day Streak", 
      value: stats.streakDays, 
      icon: Flame, 
      color: "text-accent",
      bgColor: "bg-accent/10" 
    },
    { 
      label: "Today", 
      value: stats.todayCount, 
      icon: TrendingUp, 
      color: "text-primary",
      bgColor: "bg-primary/10" 
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
              <Hand className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold">KSL Translator</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/history">
              <Button variant="ghost" size="icon">
                <History className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-heading text-3xl font-bold">
            Welcome back, {user?.displayName?.split(" ")[0] || "there"}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            Ready to translate some signs today?
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 font-heading text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`rounded-xl ${stat.bgColor} p-3`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Link to="/camera">
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-primary p-8 text-primary-foreground transition-all hover:shadow-lg">
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-2xl font-bold">Start Translating</h2>
                  <p className="mt-2 max-w-md text-primary-foreground/80">
                    Open the camera and show your KSL gestures to get instant translations
                  </p>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-foreground/20 transition-transform group-hover:scale-110">
                  <Camera className="h-8 w-8" />
                </div>
              </div>
              {/* Decorative circles */}
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-foreground/10" />
              <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-primary-foreground/10" />
            </div>
          </Link>
        </motion.div>

        {/* Recent Translations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold">Recent Translations</h2>
            <Link to="/history">
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {recentTranslations.length > 0 ? (
            <div className="space-y-3">
              {recentTranslations.map((translation) => (
                <div
                  key={translation.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Hand className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{translation.text}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(translation.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      translation.confidence >= 80
                        ? "bg-success/10 text-success"
                        : translation.confidence >= 60
                        ? "bg-warning/10 text-warning"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {translation.confidence}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <Hand className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No translations yet</p>
              <p className="text-sm text-muted-foreground/70">
                Start translating to see your history here
              </p>
              <Link to="/camera">
                <Button variant="hero" className="mt-4">
                  <Camera className="mr-2 h-4 w-4" />
                  Start Translating
                </Button>
              </Link>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
