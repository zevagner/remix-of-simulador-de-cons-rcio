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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: string | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: string | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: string | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          company_id: string | null
          created_at: string
          event_data: Json | null
          event_name: string
          id: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_name: string
          id?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      assemblies: {
        Row: {
          assembly_date: string | null
          assembly_month: string
          avg_bid_3_months: number
          avg_bid_percentage: number
          cancelled: number
          consortium_type: string
          contemplations_by_lance: number
          contemplations_by_lance_fixo: number
          contemplations_by_lance_livre: number
          contemplations_by_sorteio: number
          contemplations_cancelled: number
          contemplations_last_assembly: number
          created_at: string
          credit_range: string | null
          embedded_bid_max_percent: number
          first_assembly_date: string | null
          group_number: number
          has_embedded_bid: boolean
          id: string
          installment_due_date: string | null
          lance_fixo: number
          lance_livre: number
          max_bid_last_assembly: number
          max_bid_percentage: number
          min_bid_last_assembly: number
          min_bid_percentage: number
          next_assembly_date: string | null
          participants: number
          remaining_term: number
          sorteio: number
          total_contemplations: number
          total_term: number
          user_id: string
        }
        Insert: {
          assembly_date?: string | null
          assembly_month: string
          avg_bid_3_months?: number
          avg_bid_percentage?: number
          cancelled?: number
          consortium_type: string
          contemplations_by_lance?: number
          contemplations_by_lance_fixo?: number
          contemplations_by_lance_livre?: number
          contemplations_by_sorteio?: number
          contemplations_cancelled?: number
          contemplations_last_assembly?: number
          created_at?: string
          credit_range?: string | null
          embedded_bid_max_percent?: number
          first_assembly_date?: string | null
          group_number: number
          has_embedded_bid?: boolean
          id?: string
          installment_due_date?: string | null
          lance_fixo?: number
          lance_livre?: number
          max_bid_last_assembly?: number
          max_bid_percentage?: number
          min_bid_last_assembly?: number
          min_bid_percentage?: number
          next_assembly_date?: string | null
          participants?: number
          remaining_term?: number
          sorteio?: number
          total_contemplations?: number
          total_term?: number
          user_id: string
        }
        Update: {
          assembly_date?: string | null
          assembly_month?: string
          avg_bid_3_months?: number
          avg_bid_percentage?: number
          cancelled?: number
          consortium_type?: string
          contemplations_by_lance?: number
          contemplations_by_lance_fixo?: number
          contemplations_by_lance_livre?: number
          contemplations_by_sorteio?: number
          contemplations_cancelled?: number
          contemplations_last_assembly?: number
          created_at?: string
          credit_range?: string | null
          embedded_bid_max_percent?: number
          first_assembly_date?: string | null
          group_number?: number
          has_embedded_bid?: boolean
          id?: string
          installment_due_date?: string | null
          lance_fixo?: number
          lance_livre?: number
          max_bid_last_assembly?: number
          max_bid_percentage?: number
          min_bid_last_assembly?: number
          min_bid_percentage?: number
          next_assembly_date?: string | null
          participants?: number
          remaining_term?: number
          sorteio?: number
          total_contemplations?: number
          total_term?: number
          user_id?: string
        }
        Relationships: []
      }
      assembly_imports: {
        Row: {
          consortium_type: string
          content_hash: string | null
          created_at: string
          diff_summary: Json
          drift_warnings: Json
          duration_ms: number | null
          id: string
          import_token: string | null
          months: string[]
          parser_version: string | null
          rolled_back_at: string | null
          rolled_back_by: string | null
          rows_added: number
          rows_pruned: number
          rows_updated: number
          snapshot: Json
          status: string
          user_id: string
        }
        Insert: {
          consortium_type: string
          content_hash?: string | null
          created_at?: string
          diff_summary?: Json
          drift_warnings?: Json
          duration_ms?: number | null
          id?: string
          import_token?: string | null
          months?: string[]
          parser_version?: string | null
          rolled_back_at?: string | null
          rolled_back_by?: string | null
          rows_added?: number
          rows_pruned?: number
          rows_updated?: number
          snapshot?: Json
          status?: string
          user_id: string
        }
        Update: {
          consortium_type?: string
          content_hash?: string | null
          created_at?: string
          diff_summary?: Json
          drift_warnings?: Json
          duration_ms?: number | null
          id?: string
          import_token?: string | null
          months?: string[]
          parser_version?: string | null
          rolled_back_at?: string | null
          rolled_back_by?: string | null
          rows_added?: number
          rows_pruned?: number
          rows_updated?: number
          snapshot?: Json
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      assembly_results: {
        Row: {
          assembly_date: string | null
          assembly_month: string
          avg_bid_3_months: number
          avg_bid_percentage: number
          cancelled: number
          contemplations_by_lance: number
          contemplations_by_lance_fixo: number
          contemplations_by_lance_livre: number
          contemplations_by_sorteio: number
          contemplations_cancelled: number
          contemplations_last_assembly: number
          created_at: string
          credit_range: string | null
          group_id: string
          id: string
          lance_fixo: number
          lance_livre: number
          max_bid_last_assembly: number
          max_bid_percentage: number
          min_bid_last_assembly: number
          min_bid_percentage: number
          sorteio: number
          total_contemplations: number
        }
        Insert: {
          assembly_date?: string | null
          assembly_month: string
          avg_bid_3_months?: number
          avg_bid_percentage?: number
          cancelled?: number
          contemplations_by_lance?: number
          contemplations_by_lance_fixo?: number
          contemplations_by_lance_livre?: number
          contemplations_by_sorteio?: number
          contemplations_cancelled?: number
          contemplations_last_assembly?: number
          created_at?: string
          credit_range?: string | null
          group_id: string
          id?: string
          lance_fixo?: number
          lance_livre?: number
          max_bid_last_assembly?: number
          max_bid_percentage?: number
          min_bid_last_assembly?: number
          min_bid_percentage?: number
          sorteio?: number
          total_contemplations?: number
        }
        Update: {
          assembly_date?: string | null
          assembly_month?: string
          avg_bid_3_months?: number
          avg_bid_percentage?: number
          cancelled?: number
          contemplations_by_lance?: number
          contemplations_by_lance_fixo?: number
          contemplations_by_lance_livre?: number
          contemplations_by_sorteio?: number
          contemplations_cancelled?: number
          contemplations_last_assembly?: number
          created_at?: string
          credit_range?: string | null
          group_id?: string
          id?: string
          lance_fixo?: number
          lance_livre?: number
          max_bid_last_assembly?: number
          max_bid_percentage?: number
          min_bid_last_assembly?: number
          min_bid_percentage?: number
          sorteio?: number
          total_contemplations?: number
        }
        Relationships: [
          {
            foreignKeyName: "assembly_results_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "assemblies_normalized"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "assembly_results_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      community_case_likes: {
        Row: {
          case_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_case_likes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "community_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      community_case_views: {
        Row: {
          case_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          case_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          case_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      community_cases: {
        Row: {
          consortium_type: string | null
          created_at: string
          helpful_count: number
          id: string
          is_private: boolean
          like_count: number
          outcome: string | null
          outcome_at: string | null
          outcome_kind: string | null
          payload: Json
          reply_count: number
          source_id: string | null
          source_kind: Database["public"]["Enums"]["community_source_kind"]
          stage: string | null
          status: Database["public"]["Enums"]["community_case_status"]
          summary: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          consortium_type?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          is_private?: boolean
          like_count?: number
          outcome?: string | null
          outcome_at?: string | null
          outcome_kind?: string | null
          payload?: Json
          reply_count?: number
          source_id?: string | null
          source_kind?: Database["public"]["Enums"]["community_source_kind"]
          stage?: string | null
          status?: Database["public"]["Enums"]["community_case_status"]
          summary: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          consortium_type?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          is_private?: boolean
          like_count?: number
          outcome?: string | null
          outcome_at?: string | null
          outcome_kind?: string | null
          payload?: Json
          reply_count?: number
          source_id?: string | null
          source_kind?: Database["public"]["Enums"]["community_source_kind"]
          stage?: string | null
          status?: Database["public"]["Enums"]["community_case_status"]
          summary?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_replies: {
        Row: {
          body: string
          case_id: string
          created_at: string
          helpful_count: number
          id: string
          is_accepted: boolean
          is_ai: boolean
          not_helpful_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          case_id: string
          created_at?: string
          helpful_count?: number
          id?: string
          is_accepted?: boolean
          is_ai?: boolean
          not_helpful_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          case_id?: string
          created_at?: string
          helpful_count?: number
          id?: string
          is_accepted?: boolean
          is_ai?: boolean
          not_helpful_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_replies_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "community_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reply_votes: {
        Row: {
          created_at: string
          id: string
          reply_id: string
          user_id: string
          vote: Database["public"]["Enums"]["community_vote_kind"]
        }
        Insert: {
          created_at?: string
          id?: string
          reply_id: string
          user_id: string
          vote: Database["public"]["Enums"]["community_vote_kind"]
        }
        Update: {
          created_at?: string
          id?: string
          reply_id?: string
          user_id?: string
          vote?: Database["public"]["Enums"]["community_vote_kind"]
        }
        Relationships: [
          {
            foreignKeyName: "community_reply_votes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "community_replies"
            referencedColumns: ["id"]
          },
        ]
      }
      community_subscriptions: {
        Row: {
          case_id: string
          created_at: string
          id: string
          last_seen_reply_count: number
          last_seen_status: string | null
          user_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          last_seen_reply_count?: number
          last_seen_status?: string | null
          user_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          last_seen_reply_count?: number
          last_seen_status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_subscriptions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "community_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_users: {
        Row: {
          active: boolean
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Insert: {
          active?: boolean
          company_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Update: {
          active?: boolean
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["company_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      feedbacks: {
        Row: {
          admin_response: string | null
          company_id: string | null
          created_at: string
          id: string
          is_public: boolean
          message: string
          module: string | null
          public_summary: string | null
          resolved_at: string | null
          status: string
          type: string
          user_id: string
          user_notified: boolean
        }
        Insert: {
          admin_response?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          message: string
          module?: string | null
          public_summary?: string | null
          resolved_at?: string | null
          status?: string
          type: string
          user_id: string
          user_notified?: boolean
        }
        Update: {
          admin_response?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          message?: string
          module?: string | null
          public_summary?: string | null
          resolved_at?: string | null
          status?: string
          type?: string
          user_id?: string
          user_notified?: boolean
        }
        Relationships: []
      }
      groups: {
        Row: {
          consortium_type: string
          created_at: string
          embedded_bid_max_percent: number
          first_assembly_date: string | null
          group_number: number
          has_embedded_bid: boolean
          id: string
          installment_due_date: string | null
          next_assembly_date: string | null
          participants: number
          remaining_term: number
          total_term: number
          updated_at: string
          user_id: string
        }
        Insert: {
          consortium_type: string
          created_at?: string
          embedded_bid_max_percent?: number
          first_assembly_date?: string | null
          group_number: number
          has_embedded_bid?: boolean
          id?: string
          installment_due_date?: string | null
          next_assembly_date?: string | null
          participants?: number
          remaining_term?: number
          total_term?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          consortium_type?: string
          created_at?: string
          embedded_bid_max_percent?: number
          first_assembly_date?: string | null
          group_number?: number
          has_embedded_bid?: boolean
          id?: string
          installment_due_date?: string | null
          next_assembly_date?: string | null
          participants?: number
          remaining_term?: number
          total_term?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_sale_bids: {
        Row: {
          bid_date: string
          bid_percent: number
          bid_type: string
          bid_value: number
          client_id: string
          company_id: string | null
          created_at: string
          id: string
          notes: string | null
          user_id: string
          was_winner: boolean
        }
        Insert: {
          bid_date?: string
          bid_percent?: number
          bid_type?: string
          bid_value?: number
          client_id: string
          company_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          user_id: string
          was_winner?: boolean
        }
        Update: {
          bid_date?: string
          bid_percent?: number
          bid_type?: string
          bid_value?: number
          client_id?: string
          company_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          user_id?: string
          was_winner?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "post_sale_bids_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "post_sale_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      post_sale_clients: {
        Row: {
          bid_capacity_percent: number | null
          bid_capacity_value: number | null
          client_name: string
          client_phone: string | null
          company_id: string | null
          consortium_type: string
          contemplation_date: string | null
          created_at: string
          credit_value: number
          group_entry_date: string | null
          group_number: number | null
          id: string
          last_contact_date: string | null
          notes: string | null
          patrimony_strategy: string | null
          plan_modality: string
          priority: Database["public"]["Enums"]["post_sale_priority"]
          proposal_id: string | null
          status: Database["public"]["Enums"]["post_sale_status"]
          term_months: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bid_capacity_percent?: number | null
          bid_capacity_value?: number | null
          client_name: string
          client_phone?: string | null
          company_id?: string | null
          consortium_type: string
          contemplation_date?: string | null
          created_at?: string
          credit_value: number
          group_entry_date?: string | null
          group_number?: number | null
          id?: string
          last_contact_date?: string | null
          notes?: string | null
          patrimony_strategy?: string | null
          plan_modality?: string
          priority?: Database["public"]["Enums"]["post_sale_priority"]
          proposal_id?: string | null
          status?: Database["public"]["Enums"]["post_sale_status"]
          term_months: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bid_capacity_percent?: number | null
          bid_capacity_value?: number | null
          client_name?: string
          client_phone?: string | null
          company_id?: string | null
          consortium_type?: string
          contemplation_date?: string | null
          created_at?: string
          credit_value?: number
          group_entry_date?: string | null
          group_number?: number | null
          id?: string
          last_contact_date?: string | null
          notes?: string | null
          patrimony_strategy?: string | null
          plan_modality?: string
          priority?: Database["public"]["Enums"]["post_sale_priority"]
          proposal_id?: string | null
          status?: Database["public"]["Enums"]["post_sale_status"]
          term_months?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_sale_events: {
        Row: {
          client_id: string
          company_id: string | null
          created_at: string
          description: string | null
          event_date: string
          event_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          client_id: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          event_date?: string
          event_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          client_id?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_sale_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "post_sale_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved: boolean
          company_id: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved?: boolean
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proposal_events: {
        Row: {
          company_id: string | null
          created_at: string
          event_type: string
          from_status: Database["public"]["Enums"]["proposal_status"] | null
          id: string
          metadata: Json | null
          next_action_notes: string | null
          next_action_type: string | null
          next_contact_date: string | null
          proposal_id: string
          to_status: Database["public"]["Enums"]["proposal_status"] | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          event_type: string
          from_status?: Database["public"]["Enums"]["proposal_status"] | null
          id?: string
          metadata?: Json | null
          next_action_notes?: string | null
          next_action_type?: string | null
          next_contact_date?: string | null
          proposal_id: string
          to_status?: Database["public"]["Enums"]["proposal_status"] | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          event_type?: string
          from_status?: Database["public"]["Enums"]["proposal_status"] | null
          id?: string
          metadata?: Json | null
          next_action_notes?: string | null
          next_action_type?: string | null
          next_contact_date?: string | null
          proposal_id?: string
          to_status?: Database["public"]["Enums"]["proposal_status"] | null
          user_id?: string
        }
        Relationships: []
      }
      proposal_pdf_cache: {
        Row: {
          company_id: string | null
          content_hash: string
          filename: string
          generated_at: string
          proposal_id: string
          storage_path: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          content_hash: string
          filename: string
          generated_at?: string
          proposal_id: string
          storage_path: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          content_hash?: string
          filename?: string
          generated_at?: string
          proposal_id?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          bid_percent: number | null
          bid_zone: string | null
          client_name: string
          client_phone: string | null
          company_id: string | null
          consortium_type: string
          created_at: string
          credit_value: number
          group_number: number | null
          id: string
          installment: number
          next_action_notes: string | null
          next_action_type: string | null
          next_contact_date: string | null
          notes: string | null
          plan_type: string
          proposal_content: string
          proposal_format: string
          prospect_trigger: string
          share_token: string | null
          share_token_expires_at: string | null
          share_token_revoked_at: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          term_months: number
          total_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bid_percent?: number | null
          bid_zone?: string | null
          client_name?: string
          client_phone?: string | null
          company_id?: string | null
          consortium_type: string
          created_at?: string
          credit_value: number
          group_number?: number | null
          id?: string
          installment: number
          next_action_notes?: string | null
          next_action_type?: string | null
          next_contact_date?: string | null
          notes?: string | null
          plan_type?: string
          proposal_content: string
          proposal_format?: string
          prospect_trigger: string
          share_token?: string | null
          share_token_expires_at?: string | null
          share_token_revoked_at?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          term_months: number
          total_cost: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bid_percent?: number | null
          bid_zone?: string | null
          client_name?: string
          client_phone?: string | null
          company_id?: string | null
          consortium_type?: string
          created_at?: string
          credit_value?: number
          group_number?: number | null
          id?: string
          installment?: number
          next_action_notes?: string | null
          next_action_type?: string | null
          next_contact_date?: string | null
          notes?: string | null
          plan_type?: string
          proposal_content?: string
          proposal_format?: string
          prospect_trigger?: string
          share_token?: string | null
          share_token_expires_at?: string | null
          share_token_revoked_at?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          term_months?: number
          total_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_audit_log: {
        Row: {
          actor_user_id: string | null
          created_at: string
          db_role: string | null
          event_type: string
          id: string
          metadata: Json
          new_role: string | null
          old_role: string | null
          session_user_name: string | null
          source: string
          target_user_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          db_role?: string | null
          event_type: string
          id?: string
          metadata?: Json
          new_role?: string | null
          old_role?: string | null
          session_user_name?: string | null
          source?: string
          target_user_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          db_role?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          new_role?: string | null
          old_role?: string | null
          session_user_name?: string | null
          source?: string
          target_user_id?: string
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string
          id: string
          metadata: Json
          reviewed: boolean
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json
          reviewed?: boolean
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json
          reviewed?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_engagement: {
        Row: {
          active_days_count: number
          ai_usage_count: number
          cases_created_count: number
          company_id: string | null
          created_at: string
          helpful_replies_count: number
          last_computed_at: string
          level: number
          proposals_count: number
          replies_created_count: number
          score: number
          simulations_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active_days_count?: number
          ai_usage_count?: number
          cases_created_count?: number
          company_id?: string | null
          created_at?: string
          helpful_replies_count?: number
          last_computed_at?: string
          level?: number
          proposals_count?: number
          replies_created_count?: number
          score?: number
          simulations_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active_days_count?: number
          ai_usage_count?: number
          cases_created_count?: number
          company_id?: string | null
          created_at?: string
          helpful_replies_count?: number
          last_computed_at?: string
          level?: number
          proposals_count?: number
          replies_created_count?: number
          score?: number
          simulations_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      assemblies_normalized: {
        Row: {
          assembly_date: string | null
          assembly_month: string | null
          avg_bid_3_months: number | null
          avg_bid_percentage: number | null
          cancelled: number | null
          consortium_type: string | null
          contemplations_by_lance: number | null
          contemplations_by_lance_fixo: number | null
          contemplations_by_lance_livre: number | null
          contemplations_by_sorteio: number | null
          contemplations_cancelled: number | null
          contemplations_last_assembly: number | null
          created_at: string | null
          credit_range: string | null
          embedded_bid_max_percent: number | null
          first_assembly_date: string | null
          group_id: string | null
          group_number: number | null
          has_embedded_bid: boolean | null
          id: string | null
          installment_due_date: string | null
          lance_fixo: number | null
          lance_livre: number | null
          max_bid_last_assembly: number | null
          max_bid_percentage: number | null
          min_bid_last_assembly: number | null
          min_bid_percentage: number | null
          next_assembly_date: string | null
          participants: number | null
          remaining_term: number | null
          sorteio: number | null
          total_contemplations: number | null
          total_term: number | null
          user_id: string | null
        }
        Relationships: []
      }
      public_improvements: {
        Row: {
          id: string | null
          public_summary: string | null
          resolved_at: string | null
          type: string | null
        }
        Insert: {
          id?: string | null
          public_summary?: string | null
          resolved_at?: string | null
          type?: string | null
        }
        Update: {
          id?: string | null
          public_summary?: string | null
          resolved_at?: string | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_list_admins: {
        Args: never
        Returns: {
          email: string
          granted_at: string
          granted_by: string
          last_audit_at: string
          last_audit_source: string
          nome: string
          role: string
          user_id: string
        }[]
      }
      admin_role_history: {
        Args: { p_limit?: number }
        Returns: {
          actor_email: string
          actor_user_id: string
          created_at: string
          db_role: string
          event_type: string
          id: string
          new_role: string
          old_role: string
          source: string
          target_email: string
          target_user_id: string
        }[]
      }
      community_case_impact: {
        Args: { _case_id: string }
        Returns: {
          helpful_replies: number
          view_count: number
        }[]
      }
      community_mark_seen: { Args: { _case_id: string }; Returns: undefined }
      community_my_updates: {
        Args: never
        Returns: {
          case_id: string
          has_outcome: boolean
          last_seen_reply_count: number
          reply_count: number
          status: Database["public"]["Enums"]["community_case_status"]
          title: string
          updated_at: string
        }[]
      }
      community_pulse_24h: {
        Args: never
        Returns: {
          helpers_today: number
          new_cases_today: number
          resolved_today: number
          waiting_help: number
        }[]
      }
      community_recompute_engagement: {
        Args: { _user_id: string }
        Returns: {
          active_days_count: number
          ai_usage_count: number
          cases_created_count: number
          company_id: string | null
          created_at: string
          helpful_replies_count: number
          last_computed_at: string
          level: number
          proposals_count: number
          replies_created_count: number
          score: number
          simulations_count: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_engagement"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      community_recurring_patterns: {
        Args: { _days?: number; _limit?: number }
        Returns: {
          avg_helpful: number
          consortium_type: string
          resolved_cases: number
          stage: string
          total_cases: number
          worked_cases: number
        }[]
      }
      community_reference_cases: {
        Args: { _limit?: number }
        Returns: {
          accepted_replies: number
          consortium_type: string
          created_at: string
          helpful_count: number
          id: string
          outcome: string
          outcome_kind: string
          reply_count: number
          stage: string
          summary: string
          title: string
          view_count: number
        }[]
      }
      community_register_view: {
        Args: { _case_id: string }
        Returns: undefined
      }
      community_search: {
        Args: {
          _consortium_type?: string
          _limit?: number
          _only_resolved?: boolean
          _only_unanswered?: boolean
          _outcome_kind?: string
          _query?: string
          _stage?: string
        }
        Returns: {
          consortium_type: string
          created_at: string
          helpful_count: number
          id: string
          outcome: string
          outcome_kind: string
          reply_count: number
          stage: string
          status: Database["public"]["Enums"]["community_case_status"]
          summary: string
          title: string
          updated_at: string
          view_count: number
        }[]
      }
      community_set_vote: {
        Args: { _reply_id: string; _vote: string }
        Returns: undefined
      }
      community_similar_cases: {
        Args: {
          _case_id?: string
          _consortium_type?: string
          _limit?: number
          _query?: string
          _stage?: string
        }
        Returns: {
          consortium_type: string
          created_at: string
          helpful_count: number
          id: string
          outcome: string
          outcome_kind: string
          reply_count: number
          similarity: number
          stage: string
          status: Database["public"]["Enums"]["community_case_status"]
          summary: string
          title: string
          view_count: number
        }[]
      }
      community_user_expertise: {
        Args: { _user_id: string }
        Returns: {
          area: string
          helpful_count: number
        }[]
      }
      community_user_level: { Args: { _user_id: string }; Returns: number }
      community_user_levels: {
        Args: { p_user_ids: string[] }
        Returns: {
          level: number
          user_id: string
        }[]
      }
      current_company_id: { Args: never; Returns: string }
      current_company_ids: { Args: never; Returns: string[] }
      get_admin_active_users: {
        Args: { p_days?: number }
        Returns: {
          active_users: number
          day: string
        }[]
      }
      get_admin_daily_logins: {
        Args: { p_days?: number }
        Returns: {
          day: string
          logins: number
        }[]
      }
      get_admin_engagement_events: {
        Args: { p_recent_days?: number; p_window_days?: number }
        Returns: {
          arguments_copied: number
          last_activity_at: string
          sessions: number
          simulations: number
          user_id: string
        }[]
      }
      get_admin_funnel: {
        Args: { p_days?: number }
        Returns: {
          distinct_users: number
          event_count: number
          event_name: string
        }[]
      }
      get_admin_module_usage: {
        Args: { p_days?: number }
        Returns: {
          module: string
          usage_count: number
        }[]
      }
      get_admin_users_page: {
        Args: {
          p_approved_filter?: string
          p_email_domain?: string
          p_limit?: number
          p_new_only?: boolean
          p_offset?: number
          p_role_filter?: string
          p_search?: string
          p_sort_dir?: string
          p_sort_key?: string
        }
        Returns: {
          approved: boolean
          created_at: string
          email: string
          id: string
          nome: string
          role: string
          total_count: number
          user_id: string
        }[]
      }
      get_user_proposal_counts: {
        Args: { p_window_days?: number }
        Returns: {
          last_proposal_at: string
          proposals_count: number
          user_id: string
        }[]
      }
      get_users_with_email: {
        Args: never
        Returns: {
          email: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
      is_company_admin: { Args: { _company_id: string }; Returns: boolean }
      is_company_member: { Args: { _company_id: string }; Returns: boolean }
      list_post_sale_clients_page: {
        Args: {
          p_company_id?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_status?: string
        }
        Returns: {
          client_name: string
          client_phone: string
          consortium_type: string
          contemplation_date: string
          created_at: string
          credit_value: number
          group_entry_date: string
          group_number: number
          id: string
          last_contact_date: string
          notes: string
          plan_modality: string
          priority: Database["public"]["Enums"]["post_sale_priority"]
          proposal_id: string
          status: Database["public"]["Enums"]["post_sale_status"]
          term_months: number
          total_count: number
          updated_at: string
        }[]
      }
      list_proposal_events_page: {
        Args: {
          p_company_id?: string
          p_limit?: number
          p_offset?: number
          p_proposal_id?: string
        }
        Returns: {
          created_at: string
          event_type: string
          from_status: Database["public"]["Enums"]["proposal_status"]
          id: string
          metadata: Json
          next_action_notes: string
          next_action_type: string
          next_contact_date: string
          proposal_id: string
          to_status: Database["public"]["Enums"]["proposal_status"]
          total_count: number
        }[]
      }
      list_proposals_page: {
        Args: {
          p_company_id?: string
          p_limit?: number
          p_offset?: number
          p_only_active?: boolean
          p_search?: string
          p_status?: string
        }
        Returns: {
          bid_percent: number
          bid_zone: string
          client_name: string
          client_phone: string
          consortium_type: string
          created_at: string
          credit_value: number
          group_number: number
          id: string
          installment: number
          next_action_type: string
          next_contact_date: string
          notes: string
          plan_type: string
          proposal_format: string
          prospect_trigger: string
          status: Database["public"]["Enums"]["proposal_status"]
          term_months: number
          total_cost: number
          total_count: number
          updated_at: string
        }[]
      }
      log_security_event: {
        Args: {
          p_alert_type: string
          p_description: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: undefined
      }
      toggle_case_like: { Args: { p_case_id: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user"
      community_case_status: "aberto" | "resolvido" | "arquivado"
      community_source_kind: "proposal" | "post_sale" | "manual"
      community_vote_kind: "util" | "nao_util"
      company_role: "owner" | "admin" | "manager" | "advisor" | "viewer"
      post_sale_priority: "baixa" | "normal" | "alta"
      post_sale_status: "ativo" | "contemplado" | "quitado" | "inadimplente"
      proposal_status:
        | "prospeccao"
        | "aguardando_retorno"
        | "em_avaliacao"
        | "proposta_ajustada"
        | "fechado"
        | "perdido"
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
      app_role: ["admin", "user"],
      community_case_status: ["aberto", "resolvido", "arquivado"],
      community_source_kind: ["proposal", "post_sale", "manual"],
      community_vote_kind: ["util", "nao_util"],
      company_role: ["owner", "admin", "manager", "advisor", "viewer"],
      post_sale_priority: ["baixa", "normal", "alta"],
      post_sale_status: ["ativo", "contemplado", "quitado", "inadimplente"],
      proposal_status: [
        "prospeccao",
        "aguardando_retorno",
        "em_avaliacao",
        "proposta_ajustada",
        "fechado",
        "perdido",
      ],
    },
  },
} as const
