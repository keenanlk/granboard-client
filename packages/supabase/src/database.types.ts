export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      game_results: {
        Row: {
          game_type: string;
          id: string;
          mpr: number | null;
          opponent_id: string | null;
          played_at: string | null;
          player_id: string;
          ppd: number | null;
          room_id: string | null;
          total_darts: number;
          total_marks: number | null;
          total_rounds: number;
          total_score: number;
          won: boolean;
        };
        Insert: {
          game_type: string;
          id?: string;
          mpr?: number | null;
          opponent_id?: string | null;
          played_at?: string | null;
          player_id: string;
          ppd?: number | null;
          room_id?: string | null;
          total_darts: number;
          total_marks?: number | null;
          total_rounds: number;
          total_score: number;
          won: boolean;
        };
        Update: {
          game_type?: string;
          id?: string;
          mpr?: number | null;
          opponent_id?: string | null;
          played_at?: string | null;
          player_id?: string;
          ppd?: number | null;
          room_id?: string | null;
          total_darts?: number;
          total_marks?: number | null;
          total_rounds?: number;
          total_score?: number;
          won?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "game_results_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      invites: {
        Row: {
          created_at: string;
          expires_at: string;
          from_id: string;
          game_options: Json;
          game_type: string;
          id: string;
          room_id: string;
          status: string;
          to_id: string;
        };
        Insert: {
          created_at?: string;
          expires_at?: string;
          from_id: string;
          game_options?: Json;
          game_type: string;
          id?: string;
          room_id: string;
          status?: string;
          to_id: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          from_id?: string;
          game_options?: Json;
          game_type?: string;
          id?: string;
          room_id?: string;
          status?: string;
          to_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invites_from_id_fkey";
            columns: ["from_id"];
            isOneToOne: false;
            referencedRelation: "online_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invites_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invites_to_id_fkey";
            columns: ["to_id"];
            isOneToOne: false;
            referencedRelation: "online_players";
            referencedColumns: ["id"];
          },
        ];
      };
      online_players: {
        Row: {
          avatar_url: string | null;
          display_name: string;
          id: string;
          last_seen: string;
          status: string;
        };
        Insert: {
          avatar_url?: string | null;
          display_name: string;
          id: string;
          last_seen?: string;
          status?: string;
        };
        Update: {
          avatar_url?: string | null;
          display_name?: string;
          id?: string;
          last_seen?: string;
          status?: string;
        };
        Relationships: [];
      };
      rooms: {
        Row: {
          created_at: string;
          game_options: Json;
          game_type: string;
          guest_id: string | null;
          host_id: string;
          id: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          game_options?: Json;
          game_type: string;
          guest_id?: string | null;
          host_id: string;
          id?: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          game_options?: Json;
          game_type?: string;
          guest_id?: string | null;
          host_id?: string;
          id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_guest_id_fkey";
            columns: ["guest_id"];
            isOneToOne: false;
            referencedRelation: "online_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rooms_host_id_fkey";
            columns: ["host_id"];
            isOneToOne: false;
            referencedRelation: "online_players";
            referencedColumns: ["id"];
          },
        ];
      };
      tournament_groups: {
        Row: {
          id: number;
          number: number;
          stage_id: number;
        };
        Insert: {
          id?: number;
          number: number;
          stage_id: number;
        };
        Update: {
          id?: number;
          number?: number;
          stage_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tournament_groups_stage_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "tournament_stages";
            referencedColumns: ["id"];
          },
        ];
      };
      tournament_match_games: {
        Row: {
          id: number;
          number: number;
          opponent1: Json | null;
          opponent2: Json | null;
          parent_id: number;
          stage_id: number;
          status: number;
        };
        Insert: {
          id?: number;
          number: number;
          opponent1?: Json | null;
          opponent2?: Json | null;
          parent_id: number;
          stage_id: number;
          status?: number;
        };
        Update: {
          id?: number;
          number?: number;
          opponent1?: Json | null;
          opponent2?: Json | null;
          parent_id?: number;
          stage_id?: number;
          status?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tournament_match_games_parent_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "tournament_matches";
            referencedColumns: ["id"];
          },
        ];
      };
      tournament_matches: {
        Row: {
          child_count: number;
          group_id: number;
          id: number;
          number: number;
          opponent1: Json | null;
          opponent2: Json | null;
          round_id: number;
          stage_id: number;
          status: number;
        };
        Insert: {
          child_count?: number;
          group_id: number;
          id?: number;
          number: number;
          opponent1?: Json | null;
          opponent2?: Json | null;
          round_id: number;
          stage_id: number;
          status?: number;
        };
        Update: {
          child_count?: number;
          group_id?: number;
          id?: number;
          number?: number;
          opponent1?: Json | null;
          opponent2?: Json | null;
          round_id?: number;
          stage_id?: number;
          status?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tournament_matches_group_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "tournament_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_matches_round_fkey";
            columns: ["round_id"];
            isOneToOne: false;
            referencedRelation: "tournament_rounds";
            referencedColumns: ["id"];
          },
        ];
      };
      tournament_participants: {
        Row: {
          id: number;
          name: string;
          tournament_id: string;
        };
        Insert: {
          id?: number;
          name: string;
          tournament_id: string;
        };
        Update: {
          id?: number;
          name?: string;
          tournament_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
        ];
      };
      tournament_registrations: {
        Row: {
          id: string;
          registered_at: string;
          tournament_id: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          registered_at?: string;
          tournament_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          registered_at?: string;
          tournament_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_tournament_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_registrations_user_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "online_players";
            referencedColumns: ["id"];
          },
        ];
      };
      tournament_rounds: {
        Row: {
          group_id: number;
          id: number;
          number: number;
          stage_id: number;
        };
        Insert: {
          group_id: number;
          id?: number;
          number: number;
          stage_id: number;
        };
        Update: {
          group_id?: number;
          id?: number;
          number?: number;
          stage_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tournament_rounds_group_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "tournament_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      tournament_stages: {
        Row: {
          id: number;
          name: string;
          number: number;
          settings: Json | null;
          tournament_id: string;
          type: string;
        };
        Insert: {
          id?: number;
          name: string;
          number: number;
          settings?: Json | null;
          tournament_id: string;
          type: string;
        };
        Update: {
          id?: number;
          name?: string;
          number?: number;
          settings?: Json | null;
          tournament_id?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tournament_stages_tournament_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
        ];
      };
      tournaments: {
        Row: {
          created_at: string;
          created_by: string;
          format: string;
          game_settings: Json | null;
          id: string;
          join_code: string;
          max_participants: number | null;
          name: string;
          registration_deadline: string | null;
          scheduled_at: string | null;
          status: string;
          visibility: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          format: string;
          game_settings?: Json | null;
          id?: string;
          join_code: string;
          max_participants?: number | null;
          name: string;
          registration_deadline?: string | null;
          scheduled_at?: string | null;
          status?: string;
          visibility?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          format?: string;
          game_settings?: Json | null;
          id?: string;
          join_code?: string;
          max_participants?: number | null;
          name?: string;
          registration_deadline?: string | null;
          scheduled_at?: string | null;
          status?: string;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tournaments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "online_players";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
