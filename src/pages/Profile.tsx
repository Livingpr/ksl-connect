import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";
import {
  ArrowLeft,
  User,
  Settings,
  Volume2,
  Wifi,
  WifiOff,
  Globe,
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
            <h1 className="font-heading text-xl font-bold">Profile & Settings</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-8">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-start gap-6">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary text-3xl font-bold text-primary-foreground">
                {user?.displayName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <button className="absolute -bottom-1 -right-1 rounded-full border-2 border-card bg-muted p-1.5 hover:bg-muted/80">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="font-heading text-2xl font-bold">{user?.displayName}</h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <div className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    {roleLabels[user?.role || "student"]}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-4"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* TTS Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Volume2 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold">Voice Settings</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-play TTS</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically speak translations
                  </p>
                </div>
                <Switch checked={autoPlayTTS} onCheckedChange={setAutoPlayTTS} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Language</p>
                  <p className="text-sm text-muted-foreground">
                    Voice output language
                  </p>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "en-US" | "sw-KE")}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="en-US">English</option>
                  <option value="sw-KE">Swahili</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Offline Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <WifiOff className="h-5 w-5 text-success" />
              </div>
              <h3 className="font-heading text-lg font-semibold">Offline Mode</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Offline Mode</p>
                <p className="text-sm text-muted-foreground">
                  Cache model and assets for offline use
                </p>
              </div>
              <Switch checked={offlineMode} onCheckedChange={setOfflineMode} />
            </div>
            {offlineMode && (
              <div className="mt-4 rounded-lg bg-success/10 p-3 text-sm text-success">
                <Wifi className="mb-1 inline h-4 w-4" /> Model cached and ready for offline use
              </div>
            )}
          </motion.div>

          {/* Help & About */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="font-heading text-lg font-semibold">More</h3>
            </div>
            <div className="space-y-2">
              <button className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-muted">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  <span>Tutorial</span>
                </div>
              </button>
              <button className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-muted">
                <div className="flex items-center gap-3">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  <span>About KSL Translator</span>
                </div>
              </button>
            </div>
          </motion.div>

          {/* Logout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              variant="outline"
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
