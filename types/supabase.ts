// This file will be auto-generated from your Supabase database schema
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
// For now, we'll define the basic types manually

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          poe_account_name: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          is_content_creator: boolean
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          poe_account_name: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_content_creator?: boolean
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          poe_account_name?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_content_creator?: boolean
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      build_templates: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          class: string
          ascendancy: string | null
          level: number
          passive_tree: Json
          equipment: Json
          skills: Json
          stats: Json
          league: string | null
          patch_version: string
          complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          tags: string[] | null
          is_public: boolean
          views: number
          likes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          class: string
          ascendancy?: string | null
          level: number
          passive_tree: Json
          equipment: Json
          skills: Json
          stats: Json
          league?: string | null
          patch_version: string
          complexity?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          tags?: string[] | null
          is_public?: boolean
          views?: number
          likes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          class?: string
          ascendancy?: string | null
          level?: number
          passive_tree?: Json
          equipment?: Json
          skills?: Json
          stats?: Json
          league?: string | null
          patch_version?: string
          complexity?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          tags?: string[] | null
          is_public?: boolean
          views?: number
          likes?: number
          created_at?: string
          updated_at?: string
        }
      }
      build_likes: {
        Row: {
          user_id: string
          build_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          build_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          build_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string
          build_id: string
          parent_id: string | null
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          build_id: string
          parent_id?: string | null
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          build_id?: string
          parent_id?: string | null
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      crafting_sessions: {
        Row: {
          id: string
          user_id: string
          item_base: string
          target_mods: Json
          steps: Json
          total_cost: number | null
          success: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_base: string
          target_mods: Json
          steps: Json
          total_cost?: number | null
          success?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_base?: string
          target_mods?: Json
          steps?: Json
          total_cost?: number | null
          success?: boolean | null
          created_at?: string
        }
      }
      character_snapshots: {
        Row: {
          id: string
          user_id: string | null
          character_name: string
          class: string
          level: number
          league: string | null
          stats: Json | null
          calculated_dps: number | null
          snapshot_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          character_name: string
          class: string
          level: number
          league?: string | null
          stats?: Json | null
          calculated_dps?: number | null
          snapshot_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          character_name?: string
          class?: string
          level?: number
          league?: string | null
          stats?: Json | null
          calculated_dps?: number | null
          snapshot_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_build_views: {
        Args: { build_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}