import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { MobileNav } from "@/components/layout/MobileNav";
import {
  ArrowLeft,
  Volume2,
  Wifi,
  WifiOff,
  HelpCircle,
  Info,
  LogOut,
  Camera,
  Save,
  Loader2,
  Settings,
  Globe,
} from "lucide-react";

export default function ProfilePage() {
  const { 
    user, 
    profile, 
    preferences, 
    logout, 
    updateProfile, 
    updatePreferences,
    isAuthenticated, 
    isLoading: authLoading 
  } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || "");

  // Local state for preferences (synced with context)
  const [autoPlayTTS, setAutoPlayTTS] = useState(preferences?.autoPlayTts ?? true);
  const [speechRate, setSpeechRate] = useState(preferences?.speechRate ?? 1.0);
  const [volume, setVolume] = useState(preferences?.volume ?? 80);
  const [language, setLanguage] = useState<"english" | "swahili">(preferences?.outputLanguage ?? "english");
  const [offlineMode, setOfflineMode] = useState(true);

  // Sync local state when preferences load
  useEffect(() => {
    if (preferences) {
      setAutoPlayTTS(preferences.autoPlayTts);
      setSpeechRate(preferences.speechRate);
      setVolume(preferences.volume);
      setLanguage(preferences.outputLanguage);
    }
  }, [preferences]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
    }
  }, [profile]);

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
      await updateProfile({ displayName });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferenceChange = async (key: string, value: any) => {
    const updates: Record<string, any> = { [key]: value };
    await updatePreferences(updates);
  };

  const handleLogout = async () => {
    await logout();
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
                {profile?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
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
                  <h2 className="font-heading text-lg font-bold truncate">
                    {profile?.displayName || user?.email?.split('@')[0] || 'User'}
                  </h2>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {roleLabels[profile?.role || "student"]}
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

        {/* Translation Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-lg border border-border bg-card p-3"
        >
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-1.5">
              <Globe className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="font-heading text-sm font-semibold">Translation Preferences</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Output Language</p>
                <p className="text-xs text-muted-foreground">Language for translations</p>
              </div>
              <select
                value={language}
                onChange={(e) => {
                  const newLang = e.target.value as "english" | "swahili";
                  setLanguage(newLang);
                  handlePreferenceChange("outputLanguage", newLang);
                }}
                className="rounded border border-border bg-background px-2 py-1 text-xs"
              >
                <option value="english">English</option>
                <option value="swahili">Kiswahili</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* TTS Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg border border-border bg-card p-3"
        >
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-1.5">
              <Volume2 className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="font-heading text-sm font-semibold">Voice Settings</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-play Speech</p>
                <p className="text-xs text-muted-foreground">Speak translations automatically</p>
              </div>
              <Switch 
                checked={autoPlayTTS} 
                onCheckedChange={(checked) => {
                  setAutoPlayTTS(checked);
                  handlePreferenceChange("autoPlayTts", checked);
                }} 
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Speech Speed</p>
                <span className="text-xs text-muted-foreground">{speechRate}x</span>
              </div>
              <Slider
                value={[speechRate]}
                onValueChange={(value) => {
                  setSpeechRate(value[0]);
                }}
                onValueCommit={(value) => {
                  handlePreferenceChange("speechRate", value[0]);
                }}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Volume</p>
                <span className="text-xs text-muted-foreground">{volume}%</span>
              </div>
              <Slider
                value={[volume]}
                onValueChange={(value) => {
                  setVolume(value[0]);
                }}
                onValueCommit={(value) => {
                  handlePreferenceChange("volume", value[0]);
                }}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Offline Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
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
          transition={{ delay: 0.2 }}
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
          transition={{ delay: 0.25 }}
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
