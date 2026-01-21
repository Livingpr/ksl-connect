import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { getTranslations, getStats } from "@/lib/db";
import { PremiumButton } from "@/components/premium/PremiumButton";
import { MobileNav } from "@/components/layout/MobileNav";
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Target,
  Flame,
  Award,
  Hand,
  Lock,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import type { Translation } from "@/types";

interface WeeklyData {
  day: string;
  signs: number;
}

interface AccuracyData {
  day: string;
  accuracy: number;
}

interface TopSign {
  text: string;
  count: number;
  percentage: number;
}

export default function StatsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isPremium } = usePremium();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ totalSigns: 0, avgAccuracy: 0, todayCount: 0 });
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [accuracyData, setAccuracyData] = useState<AccuracyData[]>([]);
  const [topSigns, setTopSigns] = useState<TopSign[]>([]);
  const [streakDays, setStreakDays] = useState(7);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const dbStats = await getStats();
        setStats(dbStats);

        const allTranslations = await getTranslations();

        // Calculate weekly data
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const now = new Date();
        const weekData: WeeklyData[] = [];
        const accData: AccuracyData[] = [];

        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + 1);

          const dayTranslations = allTranslations.filter((t) => {
            const tDate = new Date(t.timestamp);
            return tDate >= date && tDate < nextDate;
          });

          weekData.push({
            day: days[date.getDay()],
            signs: dayTranslations.length,
          });

          const avgAcc =
            dayTranslations.length > 0
              ? dayTranslations.reduce((sum, t) => sum + t.confidence, 0) /
                dayTranslations.length
              : 0;

          accData.push({
            day: days[date.getDay()],
            accuracy: Math.round(avgAcc),
          });
        }

        setWeeklyData(weekData);
        setAccuracyData(accData);

        // Calculate top signs
        const signCounts: Record<string, number> = {};
        allTranslations.forEach((t) => {
          signCounts[t.text] = (signCounts[t.text] || 0) + 1;
        });

        const sorted = Object.entries(signCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5);

        const maxCount = sorted[0]?.[1] || 1;
        setTopSigns(
          sorted.map(([text, count]) => ({
            text,
            count,
            percentage: Math.round((count / maxCount) * 100),
          }))
        );

        // Calculate streak (simplified)
        setStreakDays(7);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load stats:", error);
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    {
      icon: Hand,
      value: stats.totalSigns,
      label: "Total Signs",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Target,
      value: `${stats.avgAccuracy}%`,
      label: "Avg Accuracy",
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: Flame,
      value: streakDays,
      label: "Day Streak",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: Award,
      value: isPremium ? "∞" : "50",
      label: "Signs Unlocked",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      {/* Header - Compact 48px */}
      <header className="shrink-0 border-b border-border bg-card/95 backdrop-blur-lg safe-area-top">
        <div className="flex h-12 items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="font-heading text-base font-bold">Stats</span>
            </div>
          </div>
          <PremiumButton />
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto p-3 pb-20 space-y-3">
        {/* Key Metrics - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-2">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-border">
                <CardContent className="p-3">
                  <div className={`inline-flex rounded-md ${stat.bgColor} p-1.5 mb-1.5`}>
                    <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                  </div>
                  <p className="font-heading text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Weekly Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardHeader className="p-3 pb-1">
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Weekly Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={20}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="signs"
                      fill="hsl(var(--primary))"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Accuracy Trend Chart - Premium Only */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className={!isPremium ? "relative overflow-hidden" : ""}>
            {!isPremium && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/80 backdrop-blur-sm">
                <div className="text-center p-3">
                  <Lock className="mx-auto h-6 w-6 text-muted-foreground mb-1.5" />
                  <p className="text-xs font-medium">Premium Feature</p>
                  <div className="mt-2">
                    <PremiumButton />
                  </div>
                </div>
              </div>
            )}
            <CardHeader className="p-3 pb-1">
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <TrendingUp className="h-3.5 w-3.5 text-success" />
                Accuracy Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={accuracyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                      width={25}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--success))", r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Signs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <CardHeader className="p-3 pb-1">
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <Award className="h-3.5 w-3.5 text-accent" />
                Most Used Signs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {topSigns.length > 0 ? (
                <div className="space-y-2">
                  {topSigns.map((sign, index) => (
                    <div key={sign.text} className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium truncate">{sign.text}</p>
                          <span className="text-xs text-muted-foreground shrink-0 ml-1">
                            {sign.count}x
                          </span>
                        </div>
                        <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${sign.percentage}%` }}
                            transition={{ delay: 0.3 + index * 0.05, duration: 0.4 }}
                            className="h-full rounded-full bg-primary"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Hand className="mx-auto h-6 w-6 text-muted-foreground/50" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    No signs translated yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Premium Upsell */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-accent/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-accent/20 p-2">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-sm font-semibold">
                      Unlock Premium
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Get detailed insights and accuracy trends.
                    </p>
                    <div className="mt-2">
                      <PremiumButton />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
