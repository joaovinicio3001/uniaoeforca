// GERADO pelo Supabase (projeto qmpsranxguyxxbplvcjf). NÃO editar à mão.
// Regerar após cada migration via MCP do Supabase (generate_typescript_types)
// ou: npx supabase gen types typescript --project-id qmpsranxguyxxbplvcjf

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          after_json: Json | null
          before_json: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip: unknown
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip?: unknown
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip?: unknown
          user_agent?: string | null
        }
        Relationships: []
      }
      campaign_media: {
        Row: {
          byte_size: number | null
          campaign_id: string
          created_at: string
          height: number | null
          id: string
          kind: string
          position: number
          public_url: string
          storage_key: string
          storage_provider: string
          width: number | null
        }
        Insert: {
          byte_size?: number | null
          campaign_id: string
          created_at?: string
          height?: number | null
          id?: string
          kind?: string
          position?: number
          public_url: string
          storage_key: string
          storage_provider?: string
          width?: number | null
        }
        Update: {
          byte_size?: number | null
          campaign_id?: string
          created_at?: string
          height?: number | null
          id?: string
          kind?: string
          position?: number
          public_url?: string
          storage_key?: string
          storage_provider?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_media_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_moderation_events: {
        Row: {
          actor_user_id: string | null
          campaign_id: string
          created_at: string
          from_status: Database["public"]["Enums"]["campaign_status"] | null
          id: string
          reason: string | null
          to_status: Database["public"]["Enums"]["campaign_status"]
        }
        Insert: {
          actor_user_id?: string | null
          campaign_id: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["campaign_status"] | null
          id?: string
          reason?: string | null
          to_status: Database["public"]["Enums"]["campaign_status"]
        }
        Update: {
          actor_user_id?: string | null
          campaign_id?: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["campaign_status"] | null
          id?: string
          reason?: string | null
          to_status?: Database["public"]["Enums"]["campaign_status"]
        }
        Relationships: [
          {
            foreignKeyName: "campaign_moderation_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_slug_redirects: {
        Row: {
          campaign_id: string
          created_at: string
          old_slug: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          old_slug: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          old_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_slug_redirects_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_updates: {
        Row: {
          author_user_id: string | null
          body: string
          campaign_id: string
          created_at: string
          id: string
          published_at: string | null
          title: string
        }
        Insert: {
          author_user_id?: string | null
          body?: string
          campaign_id: string
          created_at?: string
          id?: string
          published_at?: string | null
          title: string
        }
        Update: {
          author_user_id?: string | null
          body?: string
          campaign_id?: string
          created_at?: string
          id?: string
          published_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_updates_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          category_id: string | null
          city: string | null
          cover_media_id: string | null
          created_at: string
          ended_at: string | null
          goal_amount_cents: number
          id: string
          moderation_reason: string | null
          owner_user_id: string
          published_at: string | null
          raised_amount_cents: number
          search_tsv: unknown
          slug: string
          state: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          story: string
          summary: string
          supporters_count: number
          title: string
          updated_at: string
          view_count: number
          visibility: Database["public"]["Enums"]["campaign_visibility"]
        }
        Insert: {
          category_id?: string | null
          city?: string | null
          cover_media_id?: string | null
          created_at?: string
          ended_at?: string | null
          goal_amount_cents: number
          id?: string
          moderation_reason?: string | null
          owner_user_id: string
          published_at?: string | null
          raised_amount_cents?: number
          search_tsv?: unknown
          slug: string
          state?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          story?: string
          summary: string
          supporters_count?: number
          title: string
          updated_at?: string
          view_count?: number
          visibility?: Database["public"]["Enums"]["campaign_visibility"]
        }
        Update: {
          category_id?: string | null
          city?: string | null
          cover_media_id?: string | null
          created_at?: string
          ended_at?: string | null
          goal_amount_cents?: number
          id?: string
          moderation_reason?: string | null
          owner_user_id?: string
          published_at?: string | null
          raised_amount_cents?: number
          search_tsv?: unknown
          slug?: string
          state?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          story?: string
          summary?: string
          supporters_count?: number
          title?: string
          updated_at?: string
          view_count?: number
          visibility?: Database["public"]["Enums"]["campaign_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_cover_media_fk"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "campaign_media"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          position: number
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          position?: number
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          position?: number
          slug?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          anonymous: boolean
          campaign_id: string
          created_at: string
          donor_name: string | null
          donor_user_id: string | null
          fee_rule_id: string | null
          fee_rule_snapshot: Json
          gross_amount_cents: number
          id: string
          message: string | null
          net_amount_cents: number
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          platform_fee_cents: number
          provider_fee_cents: number
          status: Database["public"]["Enums"]["donation_status"]
        }
        Insert: {
          anonymous?: boolean
          campaign_id: string
          created_at?: string
          donor_name?: string | null
          donor_user_id?: string | null
          fee_rule_id?: string | null
          fee_rule_snapshot?: Json
          gross_amount_cents: number
          id?: string
          message?: string | null
          net_amount_cents: number
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          platform_fee_cents?: number
          provider_fee_cents?: number
          status?: Database["public"]["Enums"]["donation_status"]
        }
        Update: {
          anonymous?: boolean
          campaign_id?: string
          created_at?: string
          donor_name?: string | null
          donor_user_id?: string | null
          fee_rule_id?: string | null
          fee_rule_snapshot?: Json
          gross_amount_cents?: number
          id?: string
          message?: string | null
          net_amount_cents?: number
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          platform_fee_cents?: number
          provider_fee_cents?: number
          status?: Database["public"]["Enums"]["donation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_fee_rule_id_fkey"
            columns: ["fee_rule_id"]
            isOneToOne: false
            referencedRelation: "fee_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_rules: {
        Row: {
          active_from: string
          active_to: string | null
          created_at: string
          fixed_fee_cents: number
          id: string
          min_fee_cents: number
          name: string
          percentage_bps: number
          withdrawal_fee_bps: number
          withdrawal_fee_cents: number
          withdrawal_fee_min_cents: number
        }
        Insert: {
          active_from?: string
          active_to?: string | null
          created_at?: string
          fixed_fee_cents?: number
          id?: string
          min_fee_cents?: number
          name: string
          percentage_bps?: number
          withdrawal_fee_bps?: number
          withdrawal_fee_cents?: number
          withdrawal_fee_min_cents?: number
        }
        Update: {
          active_from?: string
          active_to?: string | null
          created_at?: string
          fixed_fee_cents?: number
          id?: string
          min_fee_cents?: number
          name?: string
          percentage_bps?: number
          withdrawal_fee_bps?: number
          withdrawal_fee_cents?: number
          withdrawal_fee_min_cents?: number
        }
        Relationships: []
      }
      legal_acceptances: {
        Row: {
          accepted_at: string
          document: string
          id: string
          ip: string | null
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          document: string
          id?: string
          ip?: string | null
          user_agent?: string | null
          user_id: string
          version: string
        }
        Update: {
          accepted_at?: string
          document?: string
          id?: string
          ip?: string | null
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      ledger_accounts: {
        Row: {
          code: string
          created_at: string
          id: string
          kind: string
          normal_balance: string
          wallet_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          kind: string
          normal_balance: string
          wallet_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          kind?: string
          normal_balance?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_accounts_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          account_id: string
          amount_cents: number
          created_at: string
          direction: string
          id: string
          transaction_id: string
        }
        Insert: {
          account_id: string
          amount_cents: number
          created_at?: string
          direction: string
          id?: string
          transaction_id: string
        }
        Update: {
          account_id?: string
          amount_cents?: number
          created_at?: string
          direction?: string
          id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ledger_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "ledger_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_transactions: {
        Row: {
          campaign_id: string | null
          description: string
          id: string
          idempotency_key: string
          posted_at: string
          reference_id: string | null
          reference_type: string
        }
        Insert: {
          campaign_id?: string | null
          description?: string
          id?: string
          idempotency_key: string
          posted_at?: string
          reference_id?: string | null
          reference_type: string
        }
        Update: {
          campaign_id?: string | null
          description?: string
          id?: string
          idempotency_key?: string
          posted_at?: string
          reference_id?: string | null
          reference_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_transactions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          emailed_at: string | null
          id: string
          payload: Json
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emailed_at?: string | null
          id?: string
          payload?: Json
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          emailed_at?: string | null
          id?: string
          payload?: Json
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          fail_count: number
          first_fail_at: string
          identifier: string
          last_fail_at: string
          locked_until: string | null
        }
        Insert: {
          fail_count?: number
          first_fail_at?: string
          identifier: string
          last_fail_at?: string
          locked_until?: string | null
        }
        Update: {
          fail_count?: number
          first_fail_at?: string
          identifier?: string
          last_fail_at?: string
          locked_until?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          donation_id: string
          end_to_end_id: string | null
          expires_at: string | null
          id: string
          paid_at: string | null
          payer_document: string | null
          payer_name: string | null
          provider: string
          provider_fee_cents: number
          provider_reference: string | null
          qr_code: string | null
          qr_code_base64: string | null
          raw_last_response: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          donation_id: string
          end_to_end_id?: string | null
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          payer_document?: string | null
          payer_name?: string | null
          provider?: string
          provider_fee_cents?: number
          provider_reference?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          raw_last_response?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          donation_id?: string
          end_to_end_id?: string | null
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          payer_document?: string | null
          payer_name?: string | null
          provider?: string
          provider_fee_cents?: number
          provider_reference?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          raw_last_response?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: true
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      pix_keys: {
        Row: {
          created_at: string
          disabled_at: string | null
          id: string
          owner_name: string | null
          status: Database["public"]["Enums"]["pix_key_status"]
          type: Database["public"]["Enums"]["pix_key_type"]
          user_id: string
          value_encrypted: string
          value_hash: string
          value_masked: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          disabled_at?: string | null
          id?: string
          owner_name?: string | null
          status?: Database["public"]["Enums"]["pix_key_status"]
          type: Database["public"]["Enums"]["pix_key_type"]
          user_id: string
          value_encrypted: string
          value_hash: string
          value_masked: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          disabled_at?: string | null
          id?: string
          owner_name?: string | null
          status?: Database["public"]["Enums"]["pix_key_status"]
          type?: Database["public"]["Enums"]["pix_key_type"]
          user_id?: string
          value_encrypted?: string
          value_hash?: string
          value_masked?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      provider_payouts: {
        Row: {
          completed_at: string | null
          end_to_end_id: string | null
          external_fee_cents: number | null
          failure_reason: string | null
          id: string
          provider: string
          provider_reference: string | null
          raw_last_response: Json | null
          requested_at: string
          status: Database["public"]["Enums"]["payment_status"]
          withdrawal_id: string
        }
        Insert: {
          completed_at?: string | null
          end_to_end_id?: string | null
          external_fee_cents?: number | null
          failure_reason?: string | null
          id?: string
          provider?: string
          provider_reference?: string | null
          raw_last_response?: Json | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payment_status"]
          withdrawal_id: string
        }
        Update: {
          completed_at?: string | null
          end_to_end_id?: string | null
          external_fee_cents?: number | null
          failure_reason?: string | null
          id?: string
          provider?: string
          provider_reference?: string | null
          raw_last_response?: Json | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payment_status"]
          withdrawal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_payouts_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: true
            referencedRelation: "withdrawals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_district: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          avatar_url: string | null
          birth_date: string | null
          cep: string | null
          cpf_encrypted: string | null
          cpf_hash: string | null
          cpf_last3: string | null
          created_at: string
          display_name: string | null
          full_name: string
          id: string
          marketing_opt_in: boolean
          notify_campaign_activity: boolean
          phone: string | null
          status: string
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_district?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          cep?: string | null
          cpf_encrypted?: string | null
          cpf_hash?: string | null
          cpf_last3?: string | null
          created_at?: string
          display_name?: string | null
          full_name: string
          id: string
          marketing_opt_in?: boolean
          notify_campaign_activity?: boolean
          phone?: string | null
          status?: string
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_district?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          cep?: string | null
          cpf_encrypted?: string | null
          cpf_hash?: string | null
          cpf_last3?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string
          id?: string
          marketing_opt_in?: boolean
          notify_campaign_activity?: boolean
          phone?: string | null
          status?: string
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reconciliation_items: {
        Row: {
          amount_actual_cents: number | null
          amount_expected_cents: number | null
          created_at: string
          details: Json
          external_reference: string | null
          id: string
          internal_reference: string | null
          kind: Database["public"]["Enums"]["recon_kind"]
          provider: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          run_id: string | null
          status: Database["public"]["Enums"]["recon_item_status"]
        }
        Insert: {
          amount_actual_cents?: number | null
          amount_expected_cents?: number | null
          created_at?: string
          details?: Json
          external_reference?: string | null
          id?: string
          internal_reference?: string | null
          kind: Database["public"]["Enums"]["recon_kind"]
          provider?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          run_id?: string | null
          status?: Database["public"]["Enums"]["recon_item_status"]
        }
        Update: {
          amount_actual_cents?: number | null
          amount_expected_cents?: number | null
          created_at?: string
          details?: Json
          external_reference?: string | null
          id?: string
          internal_reference?: string | null
          kind?: Database["public"]["Enums"]["recon_kind"]
          provider?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          run_id?: string | null
          status?: Database["public"]["Enums"]["recon_item_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_items_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_runs: {
        Row: {
          divergences: number
          error: string | null
          finished_at: string | null
          id: string
          items_checked: number
          kind: Database["public"]["Enums"]["recon_kind"]
          period_end: string | null
          period_start: string | null
          provider: string | null
          started_at: string
          status: string
        }
        Insert: {
          divergences?: number
          error?: string | null
          finished_at?: string | null
          id?: string
          items_checked?: number
          kind: Database["public"]["Enums"]["recon_kind"]
          period_end?: string | null
          period_start?: string | null
          provider?: string | null
          started_at?: string
          status?: string
        }
        Update: {
          divergences?: number
          error?: string | null
          finished_at?: string | null
          id?: string
          items_checked?: number
          kind?: Database["public"]["Enums"]["recon_kind"]
          period_end?: string | null
          period_start?: string | null
          provider?: string | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      data_requests: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["data_request_kind"]
          note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["data_request_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["data_request_kind"]
          note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["data_request_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["data_request_kind"]
          note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["data_request_status"]
          user_id?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          actor_user_id: string | null
          amount_cents: number
          created_at: string
          donation_id: string
          id: string
          provider_refunded: boolean
          reason: string
        }
        Insert: {
          actor_user_id?: string | null
          amount_cents: number
          created_at?: string
          donation_id: string
          id?: string
          provider_refunded?: boolean
          reason: string
        }
        Update: {
          actor_user_id?: string | null
          amount_cents?: number
          created_at?: string
          donation_id?: string
          id?: string
          provider_refunded?: boolean
          reason?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          campaign_id: string
          created_at: string
          details: string | null
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_user_id: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          campaign_id: string
          created_at?: string
          details?: string | null
          id?: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_user_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          campaign_id?: string
          created_at?: string
          details?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reporter_user_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          auth_session_id: string
          created_at: string
          id: string
          ip: string | null
          last_seen_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_session_id: string
          created_at?: string
          id?: string
          ip?: string | null
          last_seen_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_session_id?: string
          created_at?: string
          id?: string
          ip?: string | null
          last_seen_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_balances: {
        Row: {
          available_cents: number
          held_cents: number
          pending_cents: number
          reserved_cents: number
          updated_at: string
          wallet_id: string
          withdrawn_cents: number
        }
        Insert: {
          available_cents?: number
          held_cents?: number
          pending_cents?: number
          reserved_cents?: number
          updated_at?: string
          wallet_id: string
          withdrawn_cents?: number
        }
        Update: {
          available_cents?: number
          held_cents?: number
          pending_cents?: number
          reserved_cents?: number
          updated_at?: string
          wallet_id?: string
          withdrawn_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "wallet_balances_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: true
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          created_at: string
          currency: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          error: string | null
          event_id: string
          id: string
          payload: Json
          payload_hash: string
          processed_at: string | null
          provider: string
          received_at: string
          status: string
        }
        Insert: {
          error?: string | null
          event_id: string
          id?: string
          payload: Json
          payload_hash: string
          processed_at?: string | null
          provider: string
          received_at?: string
          status?: string
        }
        Update: {
          error?: string | null
          event_id?: string
          id?: string
          payload?: Json
          payload_hash?: string
          processed_at?: string | null
          provider?: string
          received_at?: string
          status?: string
        }
        Relationships: []
      }
      withdrawal_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["withdrawal_status"] | null
          id: string
          reason: string | null
          to_status: Database["public"]["Enums"]["withdrawal_status"]
          withdrawal_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["withdrawal_status"] | null
          id?: string
          reason?: string | null
          to_status: Database["public"]["Enums"]["withdrawal_status"]
          withdrawal_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["withdrawal_status"] | null
          id?: string
          reason?: string | null
          to_status?: Database["public"]["Enums"]["withdrawal_status"]
          withdrawal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_events_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "withdrawals"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          amount_cents: number
          approved_at: string | null
          campaign_id: string | null
          fee_cents: number
          failure_reason: string | null
          first_approved_at: string | null
          first_approved_by: string | null
          id: string
          net_cents: number
          paid_at: string | null
          pix_key_id: string
          pix_key_snapshot: Json
          processing_at: string | null
          rejected_at: string | null
          rejection_reason: string | null
          requested_at: string
          review_started_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount_cents: number
          approved_at?: string | null
          campaign_id?: string | null
          fee_cents?: number
          failure_reason?: string | null
          first_approved_at?: string | null
          first_approved_by?: string | null
          id?: string
          net_cents: number
          paid_at?: string | null
          pix_key_id: string
          pix_key_snapshot?: Json
          processing_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          requested_at?: string
          review_started_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount_cents?: number
          approved_at?: string | null
          campaign_id?: string | null
          fee_cents?: number
          failure_reason?: string | null
          first_approved_at?: string | null
          first_approved_by?: string | null
          id?: string
          net_cents?: number
          paid_at?: string | null
          pix_key_id?: string
          pix_key_snapshot?: Json
          processing_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          requested_at?: string
          review_started_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_pix_key_id_fkey"
            columns: ["pix_key_id"]
            isOneToOne: false
            referencedRelation: "pix_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      account_ip_signals: {
        Row: {
          first_seen_at: string
          hits: number
          ip_hash: string
          last_seen_at: string
          user_id: string
        }
        Insert: {
          first_seen_at?: string
          hits?: number
          ip_hash: string
          last_seen_at?: string
          user_id: string
        }
        Update: {
          first_seen_at?: string
          hits?: number
          ip_hash?: string
          last_seen_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blocklist: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          entity_type: Database["public"]["Enums"]["blocklist_entity"]
          entity_value: string
          id: string
          lifted_at: string | null
          lifted_by: string | null
          reason: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          entity_type: Database["public"]["Enums"]["blocklist_entity"]
          entity_value: string
          id?: string
          lifted_at?: string | null
          lifted_by?: string | null
          reason: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          entity_type?: Database["public"]["Enums"]["blocklist_entity"]
          entity_value?: string
          id?: string
          lifted_at?: string | null
          lifted_by?: string | null
          reason?: string
        }
        Relationships: []
      }
      kyc_cases: {
        Row: {
          approved_at: string | null
          birth_date_submitted: string | null
          cpf_hash_submitted: string | null
          created_at: string
          expires_at: string | null
          full_name_submitted: string | null
          id: string
          level: Database["public"]["Enums"]["kyc_level"]
          provider: string | null
          provider_reference: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          risk_score: number
          status: Database["public"]["Enums"]["kyc_status"]
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          birth_date_submitted?: string | null
          cpf_hash_submitted?: string | null
          created_at?: string
          expires_at?: string | null
          full_name_submitted?: string | null
          id?: string
          level?: Database["public"]["Enums"]["kyc_level"]
          provider?: string | null
          provider_reference?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          risk_score?: number
          status?: Database["public"]["Enums"]["kyc_status"]
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          birth_date_submitted?: string | null
          cpf_hash_submitted?: string | null
          created_at?: string
          expires_at?: string | null
          full_name_submitted?: string | null
          id?: string
          level?: Database["public"]["Enums"]["kyc_level"]
          provider?: string | null
          provider_reference?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          risk_score?: number
          status?: Database["public"]["Enums"]["kyc_status"]
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kyc_documents: {
        Row: {
          byte_size: number | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["kyc_doc_kind"]
          kyc_case_id: string
          storage_key: string
          storage_provider: string
        }
        Insert: {
          byte_size?: number | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["kyc_doc_kind"]
          kyc_case_id: string
          storage_key: string
          storage_provider?: string
        }
        Update: {
          byte_size?: number | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["kyc_doc_kind"]
          kyc_case_id?: string
          storage_key?: string
          storage_provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_documents_kyc_case_id_fkey"
            columns: ["kyc_case_id"]
            isOneToOne: false
            referencedRelation: "kyc_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_flags: {
        Row: {
          campaign_id: string | null
          created_at: string
          details: Json
          id: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["risk_severity"]
          status: Database["public"]["Enums"]["risk_flag_status"]
          type: Database["public"]["Enums"]["risk_flag_type"]
          user_id: string | null
          withdrawal_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["risk_severity"]
          status?: Database["public"]["Enums"]["risk_flag_status"]
          type: Database["public"]["Enums"]["risk_flag_type"]
          user_id?: string | null
          withdrawal_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["risk_severity"]
          status?: Database["public"]["Enums"]["risk_flag_status"]
          type?: Database["public"]["Enums"]["risk_flag_type"]
          user_id?: string | null
          withdrawal_id?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: Database["public"]["Enums"]["support_ticket_category"]
          created_at: string
          id: string
          last_message_at: string
          status: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["support_ticket_category"]
          created_at?: string
          id?: string
          last_message_at?: string
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["support_ticket_category"]
          created_at?: string
          id?: string
          last_message_at?: string
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_ticket_messages: {
        Row: {
          author_user_id: string
          body: string
          created_at: string
          id: string
          is_staff: boolean
          ticket_id: string
        }
        Insert: {
          author_user_id: string
          body: string
          created_at?: string
          id?: string
          is_staff?: boolean
          ticket_id: string
        }
        Update: {
          author_user_id?: string
          body?: string
          created_at?: string
          id?: string
          is_staff?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_holds: {
        Row: {
          amount_cents: number
          created_at: string
          created_by: string | null
          id: string
          reason: string
          released_at: string | null
          released_by: string | null
          status: Database["public"]["Enums"]["hold_status"]
          wallet_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          created_by?: string | null
          id?: string
          reason: string
          released_at?: string | null
          released_by?: string | null
          status?: Database["public"]["Enums"]["hold_status"]
          wallet_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string
          released_at?: string | null
          released_by?: string | null
          status?: Database["public"]["Enums"]["hold_status"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_holds_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_ledger_imbalanced: {
        Row: {
          delta_cents: number | null
          idempotency_key: string | null
          transaction_id: string | null
        }
        Relationships: []
      }
      v_ledger_trial_balance: {
        Row: {
          code: string | null
          signed_cents: number | null
          wallet_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      confirm_donation_payment: {
        Args: {
          p_amount_cents: number
          p_end_to_end_id?: string
          p_payer_document?: string
          p_payer_name?: string
          p_provider: string
          p_provider_reference: string
          p_provider_status: string
          p_raw?: Json
        }
        Returns: string
      }
      confirm_withdrawal_payout: {
        Args: {
          p_amount_cents: number
          p_end_to_end_id?: string
          p_external_fee_cents?: number
          p_failure_reason?: string
          p_provider: string
          p_provider_reference: string
          p_provider_status: string
          p_raw?: Json
        }
        Returns: string
      }
      health_check: { Args: never; Returns: string }
      sec_list_user_sessions: {
        Args: { p_user_id: string }
        Returns: {
          session_id: string
          created_at: string
          refreshed_at: string | null
          not_after: string | null
        }[]
      }
      sec_revoke_user_session: {
        Args: { p_user_id: string; p_session_id: string }
        Returns: boolean
      }
      anonymize_user: {
        Args: { p_actor: string; p_user_id: string }
        Returns: string
      }
      expire_stale_payments: { Args: { p_hours?: number }; Returns: number }
      reconcile_ledger_internal: { Args: { p_run_id?: string }; Returns: Json }
      settle_provider_fee_in: {
        Args: {
          p_payment_id: string
          p_real_fee_cents: number
          p_run_id?: string
        }
        Returns: string
      }
      withdrawals_near_sla: {
        Args: { p_hours?: number }
        Returns: Database["public"]["Tables"]["withdrawals"]["Row"][]
      }
      assess_withdrawal_risk: {
        Args: {
          p_critical_cents?: number
          p_fast_hours?: number
          p_unusual_cents?: number
          p_vel_count_24h?: number
          p_vel_sum_24h_cents?: number
          p_withdrawal_id: string
        }
        Returns: Json
      }
      increment_campaign_view: {
        Args: { p_slug: string }
        Returns: undefined
      }
      is_blocklisted: {
        Args: {
          p_type: Database["public"]["Enums"]["blocklist_entity"]
          p_value: string
        }
        Returns: boolean
      }
      refund_donation: {
        Args: { p_actor: string; p_donation_id: string; p_reason: string }
        Returns: Json
      }
      place_wallet_hold: {
        Args: {
          p_actor: string
          p_amount_cents: number
          p_reason: string
          p_wallet_id: string
        }
        Returns: Json
      }
      release_wallet_hold: {
        Args: { p_actor: string; p_hold_id: string }
        Returns: string
      }
      request_withdrawal: {
        Args: {
          p_amount_cents: number
          p_campaign_id?: string
          p_cooldown_hours?: number
          p_daily_max_cents?: number
          p_enhanced_kyc_cents?: number
          p_max_cents?: number
          p_min_cents?: number
          p_pix_key_id: string
          p_user_id: string
        }
        Returns: Json
      }
      set_user_block: {
        Args: {
          p_actor: string
          p_blocked: boolean
          p_reason: string
          p_user_id: string
        }
        Returns: string
      }
      submit_basic_kyc: {
        Args: { p_birth_date: string; p_full_name: string; p_user_id: string }
        Returns: Json
      }
      transition_withdrawal: {
        Args: {
          p_actor: string
          p_actor_user_id: string
          p_high_value_cents?: number
          p_reason?: string
          p_to: Database["public"]["Enums"]["withdrawal_status"]
          p_withdrawal_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "doador"
        | "criador"
        | "analista"
        | "financeiro"
        | "admin"
        | "superadmin"
      campaign_status:
        | "draft"
        | "pending_review"
        | "active"
        | "paused"
        | "completed"
        | "rejected"
        | "blocked"
        | "archived"
      campaign_visibility: "public" | "unlisted" | "private"
      data_request_kind: "export" | "deletion"
      data_request_status: "pending" | "processing" | "done" | "rejected"
      blocklist_entity:
        | "user"
        | "campaign"
        | "cpf_hash"
        | "pix_key_hash"
        | "ip_hash"
      donation_status:
        | "created"
        | "pending"
        | "paid"
        | "failed"
        | "expired"
        | "refunded"
        | "chargeback"
      hold_status: "active" | "released"
      kyc_doc_kind: "id_front" | "id_back" | "selfie" | "proof_of_address"
      kyc_level: "basic" | "enhanced"
      kyc_status:
        | "not_started"
        | "pending"
        | "in_review"
        | "approved"
        | "rejected"
        | "expired"
      payment_method: "pix" | "card"
      payment_status:
        | "created"
        | "pending"
        | "paid"
        | "failed"
        | "expired"
        | "refunded"
        | "chargeback"
      recon_item_status:
        | "matched"
        | "divergent"
        | "missing_internal"
        | "missing_external"
        | "resolved"
      recon_kind: "pix_in" | "pix_out" | "ledger_internal"
      pix_key_status: "pending" | "verified" | "disabled"
      pix_key_type: "cpf" | "cnpj" | "email" | "phone" | "evp"
      report_reason:
        | "spam"
        | "fraude"
        | "conteudo_improprio"
        | "informacao_falsa"
        | "direitos_autorais"
        | "outro"
      report_status: "open" | "reviewing" | "actioned" | "dismissed"
      risk_flag_status: "open" | "reviewing" | "resolved" | "dismissed"
      risk_flag_type:
        | "velocity_withdrawals"
        | "velocity_donations"
        | "unusual_amount"
        | "fast_create_withdraw"
        | "multi_account_ip"
        | "multi_account_cpf"
        | "multi_account_pix"
        | "blocklist_hit"
        | "manual"
      risk_level: "low" | "medium" | "high"
      risk_severity: "info" | "warning" | "critical"
      support_ticket_category:
        | "duvida"
        | "pagamento"
        | "saque"
        | "verificacao"
        | "campanha"
        | "denuncia"
        | "outro"
      support_ticket_status: "open" | "waiting_user" | "resolved" | "closed"
      withdrawal_status:
        | "requested"
        | "under_review"
        | "approved"
        | "processing"
        | "paid"
        | "rejected"
        | "failed"
        | "canceled"
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
      app_role: [
        "doador",
        "criador",
        "analista",
        "financeiro",
        "admin",
        "superadmin",
      ],
      campaign_status: [
        "draft",
        "pending_review",
        "active",
        "paused",
        "completed",
        "rejected",
        "blocked",
        "archived",
      ],
      campaign_visibility: ["public", "unlisted", "private"],
      data_request_kind: ["export", "deletion"],
      data_request_status: ["pending", "processing", "done", "rejected"],
      blocklist_entity: ["user", "campaign", "cpf_hash", "pix_key_hash", "ip_hash"],
      hold_status: ["active", "released"],
      kyc_doc_kind: ["id_front", "id_back", "selfie", "proof_of_address"],
      kyc_level: ["basic", "enhanced"],
      kyc_status: [
        "not_started",
        "pending",
        "in_review",
        "approved",
        "rejected",
        "expired",
      ],
      risk_flag_status: ["open", "reviewing", "resolved", "dismissed"],
      risk_flag_type: [
        "velocity_withdrawals",
        "velocity_donations",
        "unusual_amount",
        "fast_create_withdraw",
        "multi_account_ip",
        "multi_account_cpf",
        "multi_account_pix",
        "blocklist_hit",
        "manual",
      ],
      risk_level: ["low", "medium", "high"],
      risk_severity: ["info", "warning", "critical"],
      support_ticket_category: [
        "duvida",
        "pagamento",
        "saque",
        "verificacao",
        "campanha",
        "denuncia",
        "outro",
      ],
      support_ticket_status: ["open", "waiting_user", "resolved", "closed"],
      donation_status: [
        "created",
        "pending",
        "paid",
        "failed",
        "expired",
        "refunded",
        "chargeback",
      ],
      payment_method: ["pix", "card"],
      payment_status: [
        "created",
        "pending",
        "paid",
        "failed",
        "expired",
        "refunded",
        "chargeback",
      ],
      report_reason: [
        "spam",
        "fraude",
        "conteudo_improprio",
        "informacao_falsa",
        "direitos_autorais",
        "outro",
      ],
      report_status: ["open", "reviewing", "actioned", "dismissed"],
      recon_item_status: [
        "matched",
        "divergent",
        "missing_internal",
        "missing_external",
        "resolved",
      ],
      recon_kind: ["pix_in", "pix_out", "ledger_internal"],
      pix_key_status: ["pending", "verified", "disabled"],
      pix_key_type: ["cpf", "cnpj", "email", "phone", "evp"],
      withdrawal_status: [
        "requested",
        "under_review",
        "approved",
        "processing",
        "paid",
        "rejected",
        "failed",
        "canceled",
      ],
    },
  },
} as const
