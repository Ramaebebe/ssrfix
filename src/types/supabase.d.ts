export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      entities: { Row: { id: string; name: string }; };
      profiles: { Row: { user_id: string; default_entity: string | null; created_at: string }; };
      users_entities: { Row: { user_id: string; entity_id: string; role: 'admin'|'manager'|'user' } };
      vehicles: { Row: { id: string; entity_id: string; code: string; base_price: number; residual_rate: number; rate: number; } };
      accessories: { Row: { id: string; entity_id: string; code: string; price: number } };
      quotes: {
        Row: {
          id: string; entity_id: string; user_id: string;
          vehicle_code: string; term_months: number; distance_km: number;
          accessories: Json; result: Json | null; created_at: string;
        }
      };
    };
  };
};
