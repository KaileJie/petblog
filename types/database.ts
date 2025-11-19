export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          avatar_url?: string | null;
        };
      };
      blogs: {
        Row: {
          id: string;
          title: string;
          slug: string;
          subtitle: string | null;
          image: string | null;
          content: string;
          author: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          subtitle?: string | null;
          image?: string | null;
          content: string;
          author: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          subtitle?: string | null;
          image?: string | null;
          content?: string;
          author?: string;
        };
      };
    };
  };
};

