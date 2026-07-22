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
      api_access_log: {
        Row: {
          accessed_at: string | null
          endpoint: string
          filters: Json | null
          format: string | null
          id: number
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string | null
          endpoint: string
          filters?: Json | null
          format?: string | null
          id?: number
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string | null
          endpoint?: string
          filters?: Json | null
          format?: string | null
          id?: number
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      assessments: {
        Row: {
          brain_scan_url: string | null
          ceq7_score: number | null
          context_jsonb: Json | null
          created_at: string | null
          gad7_score: number | null
          id: string
          is_shared: boolean | null
          log_id: string | null
          meq4_score: number | null
          mood_post: number | null
          mood_pre: number | null
          phq9_score: number | null
          share_token: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          brain_scan_url?: string | null
          ceq7_score?: number | null
          context_jsonb?: Json | null
          created_at?: string | null
          gad7_score?: number | null
          id?: string
          is_shared?: boolean | null
          log_id?: string | null
          meq4_score?: number | null
          mood_post?: number | null
          mood_pre?: number | null
          phq9_score?: number | null
          share_token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          brain_scan_url?: string | null
          ceq7_score?: number | null
          context_jsonb?: Json | null
          created_at?: string | null
          gad7_score?: number | null
          id?: string
          is_shared?: boolean | null
          log_id?: string | null
          meq4_score?: number | null
          mood_post?: number | null
          mood_pre?: number | null
          phq9_score?: number | null
          share_token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "voice_logs"
            referencedColumns: ["id"]
          },
        ]
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
      bibliography: {
        Row: {
          abstract: string | null
          authority_type: string | null
          authors: string | null
          compounds: string[] | null
          content_type: string | null
          created_at: string
          doi: string | null
          featured: boolean
          full_text: string | null
          id: string
          is_approved: boolean
          journal: string | null
          pmid: string | null
          publication_date: string | null
          source: string
          source_date: string | null
          stance_score: number | null
          stance_unverified: boolean
          summary: string | null
          tags: string[] | null
          title: string
          transcript: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          abstract?: string | null
          authority_type?: string | null
          authors?: string | null
          compounds?: string[] | null
          content_type?: string | null
          created_at?: string
          doi?: string | null
          featured?: boolean
          full_text?: string | null
          id?: string
          is_approved?: boolean
          journal?: string | null
          pmid?: string | null
          publication_date?: string | null
          source?: string
          source_date?: string | null
          stance_score?: number | null
          stance_unverified?: boolean
          summary?: string | null
          tags?: string[] | null
          title: string
          transcript?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          abstract?: string | null
          authority_type?: string | null
          authors?: string | null
          compounds?: string[] | null
          content_type?: string | null
          created_at?: string
          doi?: string | null
          featured?: boolean
          full_text?: string | null
          id?: string
          is_approved?: boolean
          journal?: string | null
          pmid?: string | null
          publication_date?: string | null
          source?: string
          source_date?: string | null
          stance_score?: number | null
          stance_unverified?: boolean
          summary?: string | null
          tags?: string[] | null
          title?: string
          transcript?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      clinical_trials: {
        Row: {
          application_url: string | null
          confirmed_status: string
          created_at: string
          description: string | null
          doi: string | null
          eligibility: string | null
          end_date: string | null
          id: string
          institution: string
          is_approved: boolean
          location: string | null
          notes: string | null
          organizer_lead: string | null
          principal_investigator: string | null
          source: string | null
          start_date: string
          status: string
          submitted_by: string | null
          title: string
          trial_registry_id: string | null
          trial_type: string
          updated_at: string
          url: string | null
        }
        Insert: {
          application_url?: string | null
          confirmed_status?: string
          created_at?: string
          description?: string | null
          doi?: string | null
          eligibility?: string | null
          end_date?: string | null
          id?: string
          institution: string
          is_approved?: boolean
          location?: string | null
          notes?: string | null
          organizer_lead?: string | null
          principal_investigator?: string | null
          source?: string | null
          start_date: string
          status: string
          submitted_by?: string | null
          title: string
          trial_registry_id?: string | null
          trial_type?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          application_url?: string | null
          confirmed_status?: string
          created_at?: string
          description?: string | null
          doi?: string | null
          eligibility?: string | null
          end_date?: string | null
          id?: string
          institution?: string
          is_approved?: boolean
          location?: string | null
          notes?: string | null
          organizer_lead?: string | null
          principal_investigator?: string | null
          source?: string | null
          start_date?: string
          status?: string
          submitted_by?: string | null
          title?: string
          trial_registry_id?: string | null
          trial_type?: string
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
          erowid_flag: boolean | null
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
          erowid_flag?: boolean | null
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
          erowid_flag?: boolean | null
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
      falsification_criteria: {
        Row: {
          consequence: string
          created_at: string
          criterion: string
          deadline: string | null
          event_name: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          consequence: string
          created_at?: string
          criterion: string
          deadline?: string | null
          event_name: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          consequence?: string
          created_at?: string
          criterion?: string
          deadline?: string | null
          event_name?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      forecast_changelog: {
        Row: {
          event_name: string
          id: string
          new_probability: number | null
          new_quarter: string
          new_year: number
          previous_probability: number | null
          previous_quarter: string | null
          previous_year: number | null
          trigger_reason: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          event_name: string
          id?: string
          new_probability?: number | null
          new_quarter: string
          new_year: number
          previous_probability?: number | null
          previous_quarter?: string | null
          previous_year?: number | null
          trigger_reason: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          event_name?: string
          id?: string
          new_probability?: number | null
          new_quarter?: string
          new_year?: number
          previous_probability?: number | null
          previous_quarter?: string | null
          previous_year?: number | null
          trigger_reason?: string
          updated_at?: string
          updated_by?: string | null
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
      market_disagreements: {
        Row: {
          created_at: string
          event_name: string
          id: string
          market_source: string
          our_position: string
          reasoning: string
          their_position: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          market_source: string
          our_position: string
          reasoning: string
          their_position: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          market_source?: string
          our_position?: string
          reasoning?: string
          their_position?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_predictions: {
        Row: {
          forecaster_count: number | null
          id: number
          last_scraped: string | null
          mapped_event_name: string
          median_date: string | null
          percentile_25: string | null
          percentile_75: string | null
          prediction_type: string
          probability: number | null
          question_title: string | null
          source: string
          source_url: string | null
          volume_usd: number | null
        }
        Insert: {
          forecaster_count?: number | null
          id?: number
          last_scraped?: string | null
          mapped_event_name: string
          median_date?: string | null
          percentile_25?: string | null
          percentile_75?: string | null
          prediction_type: string
          probability?: number | null
          question_title?: string | null
          source: string
          source_url?: string | null
          volume_usd?: number | null
        }
        Update: {
          forecaster_count?: number | null
          id?: number
          last_scraped?: string | null
          mapped_event_name?: string
          median_date?: string | null
          percentile_25?: string | null
          percentile_75?: string | null
          prediction_type?: string
          probability?: number | null
          question_title?: string | null
          source?: string
          source_url?: string | null
          volume_usd?: number | null
        }
        Relationships: []
      }
      metaculus_comparisons: {
        Row: {
          forecast_event_name: string
          id: number
          last_updated: string | null
          metaculus_25th_date: string | null
          metaculus_75th_date: string | null
          metaculus_forecasters: number | null
          metaculus_median_date: string | null
          metaculus_question_id: number
          metaculus_title: string | null
          metaculus_url: string | null
        }
        Insert: {
          forecast_event_name: string
          id?: number
          last_updated?: string | null
          metaculus_25th_date?: string | null
          metaculus_75th_date?: string | null
          metaculus_forecasters?: number | null
          metaculus_median_date?: string | null
          metaculus_question_id: number
          metaculus_title?: string | null
          metaculus_url?: string | null
        }
        Update: {
          forecast_event_name?: string
          id?: number
          last_updated?: string | null
          metaculus_25th_date?: string | null
          metaculus_75th_date?: string | null
          metaculus_forecasters?: number | null
          metaculus_median_date?: string | null
          metaculus_question_id?: number
          metaculus_title?: string | null
          metaculus_url?: string | null
        }
        Relationships: []
      }
      polymarket_predictions: {
        Row: {
          end_date: string | null
          forecast_event_name: string
          id: number
          last_updated: string | null
          liquidity_usd: number | null
          probability: number | null
          question_title: string | null
          question_url: string | null
          volume_usd: number | null
        }
        Insert: {
          end_date?: string | null
          forecast_event_name: string
          id?: number
          last_updated?: string | null
          liquidity_usd?: number | null
          probability?: number | null
          question_title?: string | null
          question_url?: string | null
          volume_usd?: number | null
        }
        Update: {
          end_date?: string | null
          forecast_event_name?: string
          id?: number
          last_updated?: string | null
          liquidity_usd?: number | null
          probability?: number | null
          question_title?: string | null
          question_url?: string | null
          volume_usd?: number | null
        }
        Relationships: []
      }
      product_ratings: {
        Row: {
          accuracy_rating: number
          created_at: string
          id: string
          product_id: string
          quality_rating: number
          research_rating: number
          review_text: string | null
          updated_at: string
          user_id: string
          value_rating: number
        }
        Insert: {
          accuracy_rating: number
          created_at?: string
          id?: string
          product_id: string
          quality_rating: number
          research_rating: number
          review_text?: string | null
          updated_at?: string
          user_id: string
          value_rating: number
        }
        Update: {
          accuracy_rating?: number
          created_at?: string
          id?: string
          product_id?: string
          quality_rating?: number
          research_rating?: number
          review_text?: string | null
          updated_at?: string
          user_id?: string
          value_rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_ratings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          affiliate_only: boolean | null
          affiliate_url: string | null
          category: string
          created_at: string
          description: string
          id: string
          image_url: string
          is_affiliate: boolean
          is_approved: boolean
          manufacturer_url: string | null
          price: number
          specs: Json | null
          submitted_by: string | null
          title: string
          updated_at: string
          wavelength: string | null
        }
        Insert: {
          affiliate_only?: boolean | null
          affiliate_url?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          image_url: string
          is_affiliate?: boolean
          is_approved?: boolean
          manufacturer_url?: string | null
          price: number
          specs?: Json | null
          submitted_by?: string | null
          title: string
          updated_at?: string
          wavelength?: string | null
        }
        Update: {
          affiliate_only?: boolean | null
          affiliate_url?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          is_affiliate?: boolean
          is_approved?: boolean
          manufacturer_url?: string | null
          price?: number
          specs?: Json | null
          submitted_by?: string | null
          title?: string
          updated_at?: string
          wavelength?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          reputation_score: number
          symbol_count: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          reputation_score?: number
          symbol_count?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          reputation_score?: number
          symbol_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      protocols: {
        Row: {
          compound: string
          content_jsonb: Json | null
          created_at: string
          hero_image: string | null
          id: string
          is_published: boolean | null
          slug: string
          status: string
          tagline: string | null
          title: string
          updated_at: string
        }
        Insert: {
          compound: string
          content_jsonb?: Json | null
          created_at?: string
          hero_image?: string | null
          id?: string
          is_published?: boolean | null
          slug: string
          status?: string
          tagline?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          compound?: string
          content_jsonb?: Json | null
          created_at?: string
          hero_image?: string | null
          id?: string
          is_published?: boolean | null
          slug?: string
          status?: string
          tagline?: string | null
          title?: string
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
          orcid: string | null
          perceived_surface: string | null
          prior_exposure: boolean | null
          protocol_id: string | null
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
          orcid?: string | null
          perceived_surface?: string | null
          prior_exposure?: boolean | null
          protocol_id?: string | null
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
          orcid?: string | null
          perceived_surface?: string | null
          prior_exposure?: boolean | null
          protocol_id?: string | null
          route_of_administration?: string | null
          source?: string
          symbol_recurrence?: string | null
          symmetry?: string | null
          time_since_appearance?: string | null
          updated_at?: string
          user_id?: string | null
          voice_note_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registry_glyphs_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
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
      saved_symbols: {
        Row: {
          created_at: string
          id: string
          symbol_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          symbol_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          symbol_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_symbols_symbol_id_fkey"
            columns: ["symbol_id"]
            isOneToOne: false
            referencedRelation: "symbol_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      scraper_runs: {
        Row: {
          created_at: string
          email_sent: boolean | null
          error_message: string | null
          id: string
          last_run_at: string
          new_trials_count: number | null
          scraper_name: string
          source: string | null
          status: string
          trials_added: number | null
          trials_found: number | null
        }
        Insert: {
          created_at?: string
          email_sent?: boolean | null
          error_message?: string | null
          id?: string
          last_run_at?: string
          new_trials_count?: number | null
          scraper_name: string
          source?: string | null
          status: string
          trials_added?: number | null
          trials_found?: number | null
        }
        Update: {
          created_at?: string
          email_sent?: boolean | null
          error_message?: string | null
          id?: string
          last_run_at?: string
          new_trials_count?: number | null
          scraper_name?: string
          source?: string | null
          status?: string
          trials_added?: number | null
          trials_found?: number | null
        }
        Relationships: []
      }
      store_products: {
        Row: {
          compare_at_price: number | null
          created_at: string
          handle: string | null
          id: string
          inventory_quantity: number | null
          last_synced_at: string | null
          price: number | null
          shopify_id: string
          sold_out: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          compare_at_price?: number | null
          created_at?: string
          handle?: string | null
          id?: string
          inventory_quantity?: number | null
          last_synced_at?: string | null
          price?: number | null
          shopify_id: string
          sold_out?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          compare_at_price?: number | null
          created_at?: string
          handle?: string | null
          id?: string
          inventory_quantity?: number | null
          last_synced_at?: string | null
          price?: number | null
          shopify_id?: string
          sold_out?: boolean | null
          title?: string
          updated_at?: string
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
      symbol_submissions: {
        Row: {
          created_at: string
          description: string | null
          dose_level: string | null
          downvotes: number
          duration_seconds: number | null
          emotional_valence: string | null
          id: string
          image_url: string
          moderated_at: string | null
          moderated_by: string | null
          recurrence: string | null
          rejection_reason: string | null
          source_method: string | null
          status: Database["public"]["Enums"]["submission_status"]
          surface_type: string | null
          tags: string[] | null
          updated_at: string
          upvotes: number
          user_id: string
          wavelength: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          dose_level?: string | null
          downvotes?: number
          duration_seconds?: number | null
          emotional_valence?: string | null
          id?: string
          image_url: string
          moderated_at?: string | null
          moderated_by?: string | null
          recurrence?: string | null
          rejection_reason?: string | null
          source_method?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          surface_type?: string | null
          tags?: string[] | null
          updated_at?: string
          upvotes?: number
          user_id: string
          wavelength?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          dose_level?: string | null
          downvotes?: number
          duration_seconds?: number | null
          emotional_valence?: string | null
          id?: string
          image_url?: string
          moderated_at?: string | null
          moderated_by?: string | null
          recurrence?: string | null
          rejection_reason?: string | null
          source_method?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          surface_type?: string | null
          tags?: string[] | null
          updated_at?: string
          upvotes?: number
          user_id?: string
          wavelength?: string | null
        }
        Relationships: []
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
      symbol_votes: {
        Row: {
          created_at: string
          id: string
          symbol_id: string
          user_id: string
          vote_type: Database["public"]["Enums"]["symbol_vote_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          symbol_id: string
          user_id: string
          vote_type: Database["public"]["Enums"]["symbol_vote_type"]
        }
        Update: {
          created_at?: string
          id?: string
          symbol_id?: string
          user_id?: string
          vote_type?: Database["public"]["Enums"]["symbol_vote_type"]
        }
        Relationships: [
          {
            foreignKeyName: "symbol_votes_symbol_id_fkey"
            columns: ["symbol_id"]
            isOneToOne: false
            referencedRelation: "symbol_submissions"
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
      trial_watchlist: {
        Row: {
          created_at: string
          email: string
          id: string
          trial_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          trial_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          trial_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_watchlist_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: false
            referencedRelation: "clinical_trials"
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
      voice_logs: {
        Row: {
          analysis_jsonb: Json | null
          archetype_matches: Json | null
          assessment_id: string | null
          audio_url: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          integration_prompts: Json | null
          is_analyzed: boolean | null
          protocol_id: string | null
          protocol_match_score: number | null
          session_id: string
          tags: string[] | null
          transcript: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          analysis_jsonb?: Json | null
          archetype_matches?: Json | null
          assessment_id?: string | null
          audio_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          integration_prompts?: Json | null
          is_analyzed?: boolean | null
          protocol_id?: string | null
          protocol_match_score?: number | null
          session_id: string
          tags?: string[] | null
          transcript?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          analysis_jsonb?: Json | null
          archetype_matches?: Json | null
          assessment_id?: string | null
          audio_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          integration_prompts?: Json | null
          is_analyzed?: boolean | null
          protocol_id?: string | null
          protocol_match_score?: number | null
          session_id?: string
          tags?: string[] | null
          transcript?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_logs_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_logs_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
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
      submission_status: "pending" | "approved" | "rejected"
      symbol_vote_type: "upvote" | "downvote" | "seen_it"
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
      submission_status: ["pending", "approved", "rejected"],
      symbol_vote_type: ["upvote", "downvote", "seen_it"],
    },
  },
} as const
