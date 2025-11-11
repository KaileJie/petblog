export type Profile = {
  id: string;
  email: string;
  first_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = {
  id: string;
  email: string;
  first_name?: string | null;
  avatar_url?: string | null;
};

export type ProfileUpdate = {
  email?: string;
  first_name?: string | null;
  avatar_url?: string | null;
};

