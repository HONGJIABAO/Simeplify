export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DayType = 'weekday' | 'weekend';
export type RoomType = 'living_room' | 'kitchen' | 'bedroom' | 'bathroom';
export type RoomSlot = 'A' | 'B' | 'C' | 'D';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          household_id: string | null;
          onboarding_done: boolean;
          onboarding_step: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          email?: string | null;
          household_id?: string | null;
          onboarding_done?: boolean;
          onboarding_step?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string | null;
          email?: string | null;
          household_id?: string | null;
          onboarding_done?: boolean;
          onboarding_step?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };
      households: {
        Row: {
          id: string;
          address_state: string;
          address_city: string;
          address_street: string | null;
          residents_count: number;
          showers_per_person: number;
          minutes_per_shower: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          address_state: string;
          address_city: string;
          address_street?: string | null;
          residents_count?: number;
          showers_per_person?: number;
          minutes_per_shower?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          address_state?: string;
          address_city?: string;
          address_street?: string | null;
          residents_count?: number;
          showers_per_person?: number;
          minutes_per_shower?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      schedules: {
        Row: {
          id: string;
          household_id: string;
          day_type: DayType;
          start_time: string;
          end_time: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          day_type: DayType;
          start_time: string;
          end_time: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          household_id?: string;
          day_type?: DayType;
          start_time?: string;
          end_time?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "schedules_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };
      rooms: {
        Row: {
          id: string;
          household_id: string;
          floor: number;
          slot: RoomSlot;
          type: RoomType | null;
          name: string | null;
          is_set_up: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          floor: number;
          slot: RoomSlot;
          type?: RoomType | null;
          name?: string | null;
          is_set_up?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          household_id?: string;
          floor?: number;
          slot?: RoomSlot;
          type?: RoomType | null;
          name?: string | null;
          is_set_up?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };
      appliance_types: {
        Row: {
          id: string;
          name: string;
          sprite_key: string;
          always_on: boolean;
          needs_person: boolean;
          has_star_rating: boolean;
          swap_eligible: boolean;
          in_tray: boolean;
          sort_order: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          sprite_key: string;
          always_on?: boolean;
          needs_person?: boolean;
          has_star_rating?: boolean;
          swap_eligible?: boolean;
          in_tray?: boolean;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          sprite_key?: string;
          always_on?: boolean;
          needs_person?: boolean;
          has_star_rating?: boolean;
          swap_eligible?: boolean;
          in_tray?: boolean;
          sort_order?: number;
          active?: boolean;
        };
        Relationships: [];
      };
      appliances: {
        Row: {
          id: string;
          household_id: string;
          room_id: string;
          type: string;
          brand: string | null;
          model: string | null;
          wattage: number;
          star_rating: number | null;
          quantity: number;
          position_x: number | null;
          position_y: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          room_id: string;
          type: string;
          brand?: string | null;
          model?: string | null;
          wattage: number;
          star_rating?: number | null;
          quantity?: number;
          position_x?: number | null;
          position_y?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          household_id?: string;
          room_id?: string;
          type?: string;
          brand?: string | null;
          model?: string | null;
          wattage?: number;
          star_rating?: number | null;
          quantity?: number;
          position_x?: number | null;
          position_y?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appliances_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_appliances_room_composite";
            columns: ["room_id", "household_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id", "household_id"];
          }
        ];
      };
      day_blocks: {
        Row: {
          id: string;
          household_id: string;
          type: 'sleep' | 'meal' | 'evening' | 'shower' | 'work' | 'other' | 'away';
          title: string;
          room_id: string | null;
          start_time: string;
          end_time: string;
          appliances_on: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          type: 'sleep' | 'meal' | 'evening' | 'shower' | 'work' | 'other' | 'away';
          title: string;
          room_id?: string | null;
          start_time: string;
          end_time: string;
          appliances_on?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          household_id?: string;
          type?: 'sleep' | 'meal' | 'evening' | 'shower' | 'work' | 'other' | 'away';
          title?: string;
          room_id?: string | null;
          start_time?: string;
          end_time?: string;
          appliances_on?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_day_blocks_room_composite";
            columns: ["room_id", "household_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id", "household_id"];
          }
        ];
      };
      tariff_rates: {
        Row: {
          id: string;
          type: string;
          region: string;
          effective_from: string;
          generation_rate_low: number;
          generation_rate_high: number;
          generation_threshold_kwh: number;
          capacity_rate: number;
          network_rate: number;
          retail_charge: number;
          retail_free_limit_kwh: number;
          afa_rate: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          type?: string;
          region?: string;
          effective_from: string;
          generation_rate_low: number;
          generation_rate_high: number;
          generation_threshold_kwh?: number;
          capacity_rate: number;
          network_rate: number;
          retail_charge?: number;
          retail_free_limit_kwh?: number;
          afa_rate?: number;
          created_at?: string;
        };
        Update: {
          type?: string;
          region?: string;
          effective_from?: string;
          generation_rate_low?: number;
          generation_rate_high?: number;
          generation_threshold_kwh?: number;
          capacity_rate?: number;
          network_rate?: number;
          retail_charge?: number;
          retail_free_limit_kwh?: number;
          afa_rate?: number;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          household_id: string;
          type: 'bill_alert' | 'voting_open' | 'month_result' | 'reward_ready';
          title: string;
          message: string;
          is_read: boolean;
          linked_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          type: 'bill_alert' | 'voting_open' | 'month_result' | 'reward_ready';
          title: string;
          message: string;
          is_read?: boolean;
          linked_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          household_id?: string;
          type?: 'bill_alert' | 'voting_open' | 'month_result' | 'reward_ready';
          title?: string;
          message?: string;
          is_read?: boolean;
          linked_path?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };
      waste_scans: {
        Row: {
          id: string;
          household_id: string;
          image_path: string;
          item_name: string;
          bin_type: 'paper' | 'plastic' | 'glass_metal' | 'general';
          is_recyclable: boolean;
          confidence: number | null;
          confirmed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          image_path: string;
          item_name: string;
          bin_type: 'paper' | 'plastic' | 'glass_metal' | 'general';
          is_recyclable: boolean;
          confidence?: number | null;
          confirmed_at?: string | null;
          created_at?: string;
        };
        Update: {
          household_id?: string;
          image_path?: string;
          item_name?: string;
          bin_type?: 'paper' | 'plastic' | 'glass_metal' | 'general';
          is_recyclable?: boolean;
          confidence?: number | null;
          confirmed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "waste_scans_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };
      deeds: {
        Row: {
          id: string;
          household_id: string;
          task_type: 'recycle' | 'upload_lower_bill' | 'simulator_action';
          deed_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          task_type: 'recycle' | 'upload_lower_bill' | 'simulator_action';
          deed_date?: string;
          created_at?: string;
        };
        Update: {
          household_id?: string;
          task_type?: 'recycle' | 'upload_lower_bill' | 'simulator_action';
          deed_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deeds_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };
      points: {
        Row: {
          id: string;
          household_id: string;
          source: 'recycling' | 'energy';
          amount: number;
          deed_id: string | null;
          billing_month: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          source: 'recycling' | 'energy';
          amount: number;
          deed_id?: string | null;
          billing_month?: string | null;
          created_at?: string;
        };
        Update: {
          household_id?: string;
          source?: 'recycling' | 'energy';
          amount?: number;
          deed_id?: string | null;
          billing_month?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "points_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "points_deed_id_fkey";
            columns: ["deed_id"];
            isOneToOne: false;
            referencedRelation: "deeds";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_household: {
        Args: {
          p_state: string;
          p_city: string;
          p_street?: string | null;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
