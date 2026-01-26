import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'student' | 'teacher' | 'interpreter';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: Date;
}

export interface UserPreferences {
  outputLanguage: 'english' | 'swahili';
  autoPlayTts: boolean;
  speechRate: number;
  volume: number;
  theme: 'light' | 'dark';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  register: (email: string, password: string, displayName: string, role: UserRole) => Promise<{ error: Error | null }>;
  loginWithGoogle: () => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  assignRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch user profile and preferences
  const fetchUserData = async (userId: string, userEmail: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      // Fetch preferences
      const { data: prefsData, error: prefsError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (prefsError) throw prefsError;

      if (profileData) {
        setProfile({
          id: profileData.id,
          email: userEmail,
          displayName: profileData.display_name,
          avatarUrl: profileData.avatar_url || undefined,
          role: (roleData?.role as UserRole) || 'student',
          createdAt: new Date(profileData.created_at),
        });
      }

      if (prefsData) {
        setPreferences({
          outputLanguage: prefsData.output_language as 'english' | 'swahili',
          autoPlayTts: prefsData.auto_play_tts,
          speechRate: Number(prefsData.speech_rate),
          volume: prefsData.volume,
          theme: prefsData.theme as 'light' | 'dark',
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer Supabase calls with setTimeout
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id, session.user.email || '');
          }, 0);
        } else {
          setProfile(null);
          setPreferences(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id, session.user.email || '');
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: new Error('Invalid email or password. Please try again.') };
        }
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const register = async (email: string, password: string, displayName: string, role: UserRole) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName,
          },
        },
      });
      
      if (error) {
        if (error.message.includes('User already registered')) {
          return { error: new Error('An account with this email already exists. Please sign in instead.') };
        }
        return { error };
      }
      
      // Assign role after successful signup
      if (data.user) {
        setTimeout(async () => {
          await assignRoleInternal(data.user!.id, role);
        }, 500);
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      
      if (error) return { error };
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setPreferences(null);
  };

  const assignRoleInternal = async (userId: string, role: UserRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: role,
        }, {
          onConflict: 'user_id,role'
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  };

  const assignRole = async (role: UserRole) => {
    if (!user) return;
    
    await assignRoleInternal(user.id, role);
    
    // Update local state
    if (profile) {
      setProfile({ ...profile, role });
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: updates.displayName,
          avatar_url: updates.avatarUrl,
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      if (profile) {
        setProfile({ ...profile, ...updates });
      }
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) return;
    
    try {
      const dbUpdates: Record<string, any> = {};
      
      if (updates.outputLanguage !== undefined) {
        dbUpdates.output_language = updates.outputLanguage;
      }
      if (updates.autoPlayTts !== undefined) {
        dbUpdates.auto_play_tts = updates.autoPlayTts;
      }
      if (updates.speechRate !== undefined) {
        dbUpdates.speech_rate = updates.speechRate;
      }
      if (updates.volume !== undefined) {
        dbUpdates.volume = updates.volume;
      }
      if (updates.theme !== undefined) {
        dbUpdates.theme = updates.theme;
      }
      
      const { error } = await supabase
        .from('user_preferences')
        .update(dbUpdates)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      if (preferences) {
        setPreferences({ ...preferences, ...updates });
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update preferences. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        preferences,
        isLoading,
        isAuthenticated: !!session,
        login,
        register,
        loginWithGoogle,
        logout,
        updateProfile,
        updatePreferences,
        assignRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
