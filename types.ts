
export interface Letter {
  id: string;
  created_at?: string;
  title: string;
  date: string;
  content: string;
  excerpt: string;
  category?: 'Romantic' | 'Playful' | 'Thoughtful' | 'Memories';
  reaction?: string;
  is_favorite?: boolean;
}

export type UserRole = 'kurzkalli01' | 'Kurzsantol143' | null;

export interface UserSession {
  role: UserRole;
}
