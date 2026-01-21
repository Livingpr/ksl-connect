import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { MobileNav } from "@/components/layout/MobileNav";
import type { UserRole } from "@/types";
import {
  ArrowLeft,
  User,
  Settings,
  Volume2,
  Wifi,
  WifiOff,
  HelpCircle,
  Info,
  LogOut,
  Camera,
  Save,
  Loader2,
} from "lucide-react";

export default function ProfilePage() {
  const { user, logout, updateProfile, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [autoPlayTTS, setAutoPlayTTS] = useState(false);
  const [offlineMode, setOfflineMode] = useState(true);
  const [language, setLanguage] = useState<"en-US" | "sw-KE">("en-US");

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      updateProfile({ displayName });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const roleLabels: Record<UserRole, string> = {
    student: "Student",
    teacher: "Teacher",
    interpreter: "Interpreter",
  };

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
            <h1 className="font-heading text-base font-bold">Profile</h1>
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto p-3 pb-20 space-y-3">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-start gap-3">
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-xl font-bold text-primary-foreground">
                {user?.displayName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <button className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-card bg-muted p-1 hover:bg-muted/80">
                <Camera className="h-3 w-3" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name" className="text-xs">Display Name</Label>
                    <Input
                      id="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="mr-1 h-3 w-3" />
                      )}
                      Save
                    </Button>
                    <Button variant="outline" size="sm" className="h-7" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="font-heading text-lg font-bold truncate">{user?.displayName}</h2>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {roleLabels[user?.role || "student"]}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* TTS Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-lg border border-border bg-card p-3"
        >
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-1.5">
              <Volume2 className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="font-heading text-sm font-semibold">Voice Settings</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-play TTS</p>
                <p className="text-xs text-muted-foreground">Auto speak translations</p>
              </div>
              <Switch checked={autoPlayTTS} onCheckedChange={setAutoPlayTTS} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Language</p>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "en-US" | "sw-KE")}
                className="rounded border border-border bg-background px-2 py-1 text-xs"
              >
                <option value="en-US">English</option>
                <option value="sw-KE">Swahili</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Offline Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg border border-border bg-card p-3"
        >
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-md bg-success/10 p-1.5">
              <WifiOff className="h-3.5 w-3.5 text-success" />
            </div>
            <h3 className="font-heading text-sm font-semibold">Offline Mode</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable Offline</p>
              <p className="text-xs text-muted-foreground">Cache for offline use</p>
            </div>
            <Switch checked={offlineMode} onCheckedChange={setOfflineMode} />
          </div>
          {offlineMode && (
            <div className="mt-2 rounded-md bg-success/10 p-2 text-xs text-success flex items-center gap-1.5">
              <Wifi className="h-3 w-3" /> Ready for offline
            </div>
          )}
        </motion.div>

        {/* Help & About */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-lg border border-border bg-card p-3"
        >
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-md bg-muted p-1.5">
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <h3 className="font-heading text-sm font-semibold">More</h3>
          </div>
          <div className="space-y-1">
            <button className="flex w-full items-center gap-2.5 rounded-md p-2 text-left text-sm hover:bg-muted">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              Tutorial
            </button>
            <button className="flex w-full items-center gap-2.5 rounded-md p-2 text-left text-sm hover:bg-muted">
              <Info className="h-4 w-4 text-muted-foreground" />
              About KSL Translator
            </button>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="outline"
            className="w-full h-10 border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </motion.div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
