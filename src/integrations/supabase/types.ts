export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      translations: {
        Row: {
          confidence: number
          created_at: string
          duration_ms: number | null
          gesture_buffer: string[] | null
          hand_type: string | null
          id: string
          is_favorite: boolean
          is_synced: boolean
          output_language: Database["public"]["Enums"]["output_language"]
          sign_text: string
          translated_sentence: string | null
          user_id: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          duration_ms?: number | null
          gesture_buffer?: string[] | null
          hand_type?: string | null
          id?: string
          is_favorite?: boolean
          is_synced?: boolean
          output_language?: Database["public"]["Enums"]["output_language"]
          sign_text: string
          translated_sentence?: string | null
          user_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          duration_ms?: number | null
          gesture_buffer?: string[] | null
          hand_type?: string | null
          id?: string
          is_favorite?: boolean
          is_synced?: boolean
          output_language?: Database["public"]["Enums"]["output_language"]
          sign_text?: string
          translated_sentence?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          auto_play_tts: boolean
          created_at: string
          output_language: Database["public"]["Enums"]["output_language"]
          speech_rate: number
          theme: Database["public"]["Enums"]["app_theme"]
          updated_at: string
          user_id: string
          volume: number
        }
        Insert: {
          auto_play_tts?: boolean
          created_at?: string
          output_language?: Database["public"]["Enums"]["output_language"]
          speech_rate?: number
          theme?: Database["public"]["Enums"]["app_theme"]
          updated_at?: string
          user_id: string
          volume?: number
        }
        Update: {
          auto_play_tts?: boolean
          created_at?: string
          output_language?: Database["public"]["Enums"]["output_language"]
          speech_rate?: number
          theme?: Database["public"]["Enums"]["app_theme"]
          updated_at?: string
          user_id?: string
          volume?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_statistics: {
        Row: {
          average_accuracy: number
          created_at: string
          last_active_date: string | null
          streak_days: number
          total_duration_seconds: number
          total_signs_translated: number
          updated_at: string
          user_id: string
        }
        Insert: {
          average_accuracy?: number
          created_at?: string
          last_active_date?: string | null
          streak_days?: number
          total_duration_seconds?: number
          total_signs_translated?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          average_accuracy?: number
          created_at?: string
          last_active_date?: string | null
          streak_days?: number
          total_duration_seconds?: number
          total_signs_translated?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { check_user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_owner: { Args: { record_user_id: string }; Returns: boolean }
    }
    Enums: {
      app_theme: "light" | "dark"
      output_language: "english" | "swahili"
      user_role: "student" | "teacher" | "interpreter"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_theme: ["light", "dark"],
      output_language: ["english", "swahili"],
      user_role: ["student", "teacher", "interpreter"],
    },
  },
} as const
