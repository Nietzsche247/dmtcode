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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          symbol_id: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          symbol_id?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          symbol_id?: string | null
          type?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          threshold: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          threshold?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          threshold?: number | null
        }
        Relationships: []
      }
      clinical_trials: {
        Row: {
          created_at: string
          description: string | null
          doi: string | null
          end_date: string | null
          id: string
          institution: string
          is_approved: boolean
          principal_investigator: string | null
          start_date: string
          status: string
          submitted_by: string | null
          title: string
          trial_registry_id: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          doi?: string | null
          end_date?: string | null
          id?: string
          institution: string
          is_approved?: boolean
          principal_investigator?: string | null
          start_date: string
          status: string
          submitted_by?: string | null
          title: string
          trial_registry_id?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          doi?: string | null
          end_date?: string | null
          id?: string
          institution?: string
          is_approved?: boolean
          principal_investigator?: string | null
          start_date?: string
          status?: string
          submitted_by?: string | null
          title?: string
          trial_registry_id?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      community_notes: {
        Row: {
          author_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          is_approved: boolean
          note_text: string
          updated_at: string
          upvotes: number
        }
        Insert: {
          author_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          is_approved?: boolean
          note_text: string
          updated_at?: string
          upvotes?: number
        }
        Update: {
          author_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          is_approved?: boolean
          note_text?: string
          updated_at?: string
          upvotes?: number
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_type: string
          id: string
          is_approved: boolean
          location: string | null
          organizer: string | null
          submitted_by: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_type: string
          id?: string
          is_approved?: boolean
          location?: string | null
          organizer?: string | null
          submitted_by?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          is_approved?: boolean
          location?: string | null
          organizer?: string | null
          submitted_by?: string | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      glyph_votes: {
        Row: {
          created_at: string
          glyph_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          glyph_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          glyph_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "glyph_votes_glyph_id_fkey"
            columns: ["glyph_id"]
            isOneToOne: false
            referencedRelation: "glyphs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "glyph_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      glyphs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string
          title: string
          updated_at: string
          upvotes: number
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          title: string
          updated_at?: string
          upvotes?: number
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          title?: string
          updated_at?: string
          upvotes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "glyphs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      registry_confirmations: {
        Row: {
          confirmation_type: string
          created_at: string
          glyph_id: string
          id: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          confirmation_type: string
          created_at?: string
          glyph_id: string
          id?: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          confirmation_type?: string
          created_at?: string
          glyph_id?: string
          id?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registry_confirmations_glyph_id_fkey"
            columns: ["glyph_id"]
            isOneToOne: false
            referencedRelation: "registry_glyphs"
            referencedColumns: ["id"]
          },
        ]
      }
      registry_glyphs: {
        Row: {
          approximate_dose: string | null
          body_position: string | null
          clarity_rating: number | null
          communicative_intent: string | null
          confidence_rating: number | null
          confirmation_count: number
          created_at: string
          depth: string | null
          drawing_duration_seconds: number | null
          emotional_valence: string | null
          free_text_notes: string | null
          id: string
          image_data: string
          is_unique: boolean
          lighting_conditions: string | null
          motif_tags: string[] | null
          motion: string | null
          perceived_surface: string | null
          prior_exposure: boolean | null
          route_of_administration: string | null
          source: string
          symbol_recurrence: string | null
          symmetry: string | null
          time_since_appearance: string | null
          updated_at: string
          user_id: string | null
          voice_note_url: string | null
        }
        Insert: {
          approximate_dose?: string | null
          body_position?: string | null
          clarity_rating?: number | null
          communicative_intent?: string | null
          confidence_rating?: number | null
          confirmation_count?: number
          created_at?: string
          depth?: string | null
          drawing_duration_seconds?: number | null
          emotional_valence?: string | null
          free_text_notes?: string | null
          id?: string
          image_data: string
          is_unique?: boolean
          lighting_conditions?: string | null
          motif_tags?: string[] | null
          motion?: string | null
          perceived_surface?: string | null
          prior_exposure?: boolean | null
          route_of_administration?: string | null
          source: string
          symbol_recurrence?: string | null
          symmetry?: string | null
          time_since_appearance?: string | null
          updated_at?: string
          user_id?: string | null
          voice_note_url?: string | null
        }
        Update: {
          approximate_dose?: string | null
          body_position?: string | null
          clarity_rating?: number | null
          communicative_intent?: string | null
          confidence_rating?: number | null
          confirmation_count?: number
          created_at?: string
          depth?: string | null
          drawing_duration_seconds?: number | null
          emotional_valence?: string | null
          free_text_notes?: string | null
          id?: string
          image_data?: string
          is_unique?: boolean
          lighting_conditions?: string | null
          motif_tags?: string[] | null
          motion?: string | null
          perceived_surface?: string | null
          prior_exposure?: boolean | null
          route_of_administration?: string | null
          source?: string
          symbol_recurrence?: string | null
          symmetry?: string | null
          time_since_appearance?: string | null
          updated_at?: string
          user_id?: string | null
          voice_note_url?: string | null
        }
        Relationships: []
      }
      retreats: {
        Row: {
          contact_email: string | null
          country: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_approved: boolean
          location: string
          name: string
          submitted_by: string | null
          tags: string[] | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          contact_email?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_approved?: boolean
          location: string
          name: string
          submitted_by?: string | null
          tags?: string[] | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          contact_email?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_approved?: boolean
          location?: string
          name?: string
          submitted_by?: string | null
          tags?: string[] | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      surface_tags: {
        Row: {
          created_at: string
          glyph_id: string
          id: string
          tag_name: string
          upvotes: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          glyph_id: string
          id?: string
          tag_name: string
          upvotes?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          glyph_id?: string
          id?: string
          tag_name?: string
          upvotes?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surface_tags_glyph_id_fkey"
            columns: ["glyph_id"]
            isOneToOne: false
            referencedRelation: "glyphs"
            referencedColumns: ["id"]
          },
        ]
      }
      symbol_tag_votes: {
        Row: {
          created_at: string | null
          id: string
          tag_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          tag_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          tag_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "symbol_tag_votes_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "symbol_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      symbol_tags: {
        Row: {
          created_at: string | null
          glyph_id: string
          id: string
          tag_name: string
          upvotes: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          glyph_id: string
          id?: string
          tag_name: string
          upvotes?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          glyph_id?: string
          id?: string
          tag_name?: string
          upvotes?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "symbol_tags_glyph_id_fkey"
            columns: ["glyph_id"]
            isOneToOne: false
            referencedRelation: "registry_glyphs"
            referencedColumns: ["id"]
          },
        ]
      }
      tag_votes: {
        Row: {
          created_at: string
          id: string
          tag_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tag_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tag_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_votes_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "surface_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      theories: {
        Row: {
          content: string
          created_at: string
          id: string
          is_approved: boolean
          probability_percentage: number | null
          summary: string
          title: string
          updated_at: string
          upvotes: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean
          probability_percentage?: number | null
          summary: string
          title: string
          updated_at?: string
          upvotes?: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          probability_percentage?: number | null
          summary?: string
          title?: string
          updated_at?: string
          upvotes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "theories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      theory_votes: {
        Row: {
          created_at: string
          id: string
          theory_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          theory_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          theory_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "theory_votes_theory_id_fkey"
            columns: ["theory_id"]
            isOneToOne: false
            referencedRelation: "theories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theory_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_ratings: {
        Row: {
          authenticity_rating: number
          created_at: string
          id: string
          integration_rating: number
          retreat_id: string
          review_text: string | null
          safety_rating: number
          updated_at: string
          user_id: string
          value_rating: number
        }
        Insert: {
          authenticity_rating: number
          created_at?: string
          id?: string
          integration_rating: number
          retreat_id: string
          review_text?: string | null
          safety_rating: number
          updated_at?: string
          user_id: string
          value_rating: number
        }
        Update: {
          authenticity_rating?: number
          created_at?: string
          id?: string
          integration_rating?: number
          retreat_id?: string
          review_text?: string | null
          safety_rating?: number
          updated_at?: string
          user_id?: string
          value_rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "trust_ratings_retreat_id_fkey"
            columns: ["retreat_id"]
            isOneToOne: false
            referencedRelation: "retreats"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_name: string
          earned_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          badge_name: string
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          badge_name?: string
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          badges_earned: string[] | null
          created_at: string | null
          id: string
          rank: number | null
          session_id: string
          total_submissions: number | null
          total_tags_added: number | null
          total_validations: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          badges_earned?: string[] | null
          created_at?: string | null
          id?: string
          rank?: number | null
          session_id: string
          total_submissions?: number | null
          total_tags_added?: number | null
          total_validations?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          badges_earned?: string[] | null
          created_at?: string | null
          id?: string
          rank?: number | null
          session_id?: string
          total_submissions?: number | null
          total_tags_added?: number | null
          total_validations?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
