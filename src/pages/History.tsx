import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
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
  Share2,
  Calendar,
  Clock,
  Hand,
  Download,
  Grid,
  List,
  Filter,
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-heading text-xl font-bold">Translation History</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Search & Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search translations..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <Button
                  key={f.value}
                  variant={filter === f.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-1 rounded-lg border border-border p-1">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Translations List/Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : translations.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                : "space-y-3"
            }
          >
            {translations.map((translation, index) => (
              <motion.div
                key={translation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md ${
                  viewMode === "grid" ? "p-4" : "p-4"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Hand className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-semibold">
                        {translation.text}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            translation.confidence >= 80
                              ? "bg-success/10 text-success"
                              : translation.confidence >= 60
                              ? "bg-warning/10 text-warning"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {translation.confidence}%
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(translation.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleFavorite(translation.id!)}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          translation.isFavorite
                            ? "fill-warning text-warning"
                            : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(translation.id!)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Hand className="mx-auto h-16 w-16 text-muted-foreground/30" />
            <h3 className="mt-4 font-heading text-lg font-semibold">No translations found</h3>
            <p className="mt-2 text-muted-foreground">
              {searchQuery
                ? "Try a different search term"
                : filter === "favorites"
                ? "Star translations to see them here"
                : "Start translating to build your history"}
            </p>
            <Link to="/camera">
              <Button variant="hero" className="mt-4">
                Start Translating
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
