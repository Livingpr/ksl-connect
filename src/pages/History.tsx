import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { MobileNav } from "@/components/layout/MobileNav";
import {
  getTranslations,
  searchTranslations,
  toggleFavorite,
  deleteTranslation,
  getFavorites,
  getTranslationsByDate,
} from "@/lib/db";
import type { Translation } from "@/types";
import {
  ArrowLeft,
  Search,
  Star,
  Trash2,
  Clock,
  Hand,
  Download,
  Grid,
  List,
} from "lucide-react";

type FilterType = "all" | "today" | "week" | "favorites";

export default function HistoryPage() {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isLoading, setIsLoading] = useState(true);

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    loadTranslations();
  }, [filter]);

  const loadTranslations = async () => {
    setIsLoading(true);
    try {
      let result: Translation[] = [];
      const now = new Date();
      
      switch (filter) {
        case "today":
          const todayStart = new Date(now.setHours(0, 0, 0, 0));
          result = await getTranslationsByDate(todayStart, new Date());
          break;
        case "week":
          const weekStart = new Date(now.setDate(now.getDate() - 7));
          result = await getTranslationsByDate(weekStart, new Date());
          break;
        case "favorites":
          result = await getFavorites();
          break;
        default:
          result = await getTranslations();
      }
      
      setTranslations(result);
    } catch (error) {
      console.error("Failed to load translations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await searchTranslations(query);
      setTranslations(results);
    } else {
      loadTranslations();
    }
  };

  const handleToggleFavorite = async (id: number) => {
    await toggleFavorite(id);
    setTranslations((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isFavorite: !t.isFavorite } : t))
    );
  };

  const handleDelete = async (id: number) => {
    await deleteTranslation(id);
    setTranslations((prev) => prev.filter((t) => t.id !== id));
  };

  const handleExportCSV = () => {
    const csv = [
      ["Text", "Confidence", "Timestamp", "Favorite"],
      ...translations.map((t) => [
        t.text,
        t.confidence.toString(),
        new Date(t.timestamp).toISOString(),
        t.isFavorite ? "Yes" : "No",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ksl-translations.csv";
    a.click();
  };

  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "favorites", label: "Favorites" },
  ];

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      {/* Header - Compact 48px */}
      <header className="shrink-0 border-b border-border bg-card/80 backdrop-blur-lg safe-area-top">
        <div className="flex h-12 items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="font-heading text-base font-bold">History</h1>
          </div>
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleExportCSV}>
            <Download className="mr-1 h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </header>

      {/* Search & Filters - Compact */}
      <div className="shrink-0 border-b border-border bg-card px-3 py-2 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-9 pl-8 text-sm"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 overflow-x-auto">
            {filters.map((f) => (
              <Button
                key={f.value}
                variant={filter === f.value ? "default" : "outline"}
                size="sm"
                className="h-7 px-2.5 text-xs shrink-0"
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-0.5 rounded-md border border-border p-0.5 shrink-0 ml-2">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-6 w-6"
              onClick={() => setViewMode("list")}
            >
              <List className="h-3 w-3" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-6 w-6"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Translations List - Scrollable */}
      <main className="flex-1 overflow-y-auto p-3 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : translations.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 gap-2"
                : "space-y-2"
            }
          >
            {translations.map((translation, index) => (
              <motion.div
                key={translation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="group rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Hand className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading text-sm font-semibold truncate">
                        {translation.text}
                      </h3>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                          className={`rounded-full px-1.5 py-0.5 font-medium ${
                            translation.confidence >= 80
                              ? "bg-success/10 text-success"
                              : translation.confidence >= 60
                              ? "bg-warning/10 text-warning"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {translation.confidence}%
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(translation.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleToggleFavorite(translation.id!)}
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${
                          translation.isFavorite
                            ? "fill-warning text-warning"
                            : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDelete(translation.id!)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <Hand className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <h3 className="mt-3 font-heading text-sm font-semibold">No translations</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {searchQuery
                ? "Try a different search"
                : filter === "favorites"
                ? "Star translations to see them here"
                : "Start translating to build history"}
            </p>
            <Link to="/camera">
              <Button variant="hero" size="sm" className="mt-3">
                Start Translating
              </Button>
            </Link>
          </div>
        )}
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
