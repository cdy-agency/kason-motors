// 📁 types/database.types.ts

export type UserRole = "admin" | "user";
export type BlogPostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          role: UserRole;
          password?: string | null;
          updated_at: string;
          reset_token?: string | null;
          reset_token_expiry?: string | null;
        };

        Insert: {
          created_at?: string;
          email: string;
          full_name: string;
          id: string;
          role?: UserRole;
          updated_at?: string;
          password?: string | null;
          reset_token?: string | null;
          reset_token_expiry?: string | null;
        };

        Update: {
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          role?: UserRole;
          updated_at?: string;
          password?: string | null;
          reset_token?: string | null;
          reset_token_expiry?: string | null;
        };

        Relationships: [];
      };

      blog_categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      blog_tags: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };

      blog_posts: {
        Row: {
          author_id: string | null;
          category_id: string | null;
          content: string;
          created_at: string;
          excerpt: string | null;
          featured_image: string | null;
          id: string;
          published_at: string | null;
          slug: string;
          status: BlogPostStatus;
          title: string;
          updated_at: string;
          vehicle_id: number | null;
        };
        Insert: {
          author_id?: string | null;
          category_id?: string | null;
          content?: string;
          created_at?: string;
          excerpt?: string | null;
          featured_image?: string | null;
          id?: string;
          published_at?: string | null;
          slug: string;
          status?: BlogPostStatus;
          title: string;
          updated_at?: string;
          vehicle_id?: number | null;
        };
        Update: {
          author_id?: string | null;
          category_id?: string | null;
          content?: string;
          created_at?: string;
          excerpt?: string | null;
          featured_image?: string | null;
          id?: string;
          published_at?: string | null;
          slug?: string;
          status?: BlogPostStatus;
          title?: string;
          updated_at?: string;
          vehicle_id?: number | null;
        };
        Relationships: [];
      };

      hero_settings: {
        Row: {
          id: string;
          slides: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slides?: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slides?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };

      blog_post_tags: {
        Row: {
          post_id: string;
          tag_id: string;
        };
        Insert: {
          post_id: string;
          tag_id: string;
        };
        Update: {
          post_id?: string;
          tag_id?: string;
        };
        Relationships: [];
      };

      blog_post_images: {
        Row: {
          caption: string | null;
          created_at: string;
          id: string;
          image_url: string;
          post_id: string;
        };
        Insert: {
          caption?: string | null;
          created_at?: string;
          id?: string;
          image_url: string;
          post_id: string;
        };
        Update: {
          caption?: string | null;
          created_at?: string;
          id?: string;
          image_url?: string;
          post_id?: string;
        };
        Relationships: [];
      };

      cars: {
        Row: {
          id: number;
          name: string | null;
          category: string | null;
          type: string | null;
          price: number | null;
          year: number | null;
          mileage: string | null;
          stock_count: number | null;
          fuel: string | null;
          transmission: string | null;
          image: string | null;
          badge: string | null;

          // ✅ ADDED FIELD
          full_option: boolean | null;

          created_at: string | null;
          updated_at: string | null;
        };

        Insert: {
          id?: number;
          name?: string | null;
          category?: string | null;
          type?: string | null;
          price?: number | null;
          year?: number | null;
          mileage?: string | null;
          stock_count?: number | null;
          fuel?: string | null;
          transmission?: string | null;
          image?: string | null;
          badge?: string | null;

          // ✅ ADDED FIELD
          full_option?: boolean | null;

          created_at?: string | null;
          updated_at?: string | null;
        };

        Update: {
          id?: number;
          name?: string | null;
          category?: string | null;
          type?: string | null;
          price?: number | null;
          year?: number | null;
          mileage?: string | null;
          stock_count?: number | null;
          fuel?: string | null;
          transmission?: string | null;
          image?: string | null;
          badge?: string | null;

          // ✅ ADDED FIELD
          full_option?: boolean | null;

          created_at?: string | null;
          updated_at?: string | null;
        };

        Relationships: [];
      };

      book_test_driver: {
        Row: {
          id: number;
          car_id: number;
          full_name: string;
          email: string;
          phone: string;
          preferred_date: string;
          notes: string | null;
          created_at: string;
          read: boolean;
        };

        Insert: {
          id?: number;
          car_id: number;
          full_name: string;
          email: string;
          phone: string;
          preferred_date: string;
          notes?: string | null;
          created_at?: string;
          read?: boolean;
        };

        Update: {
          id?: number;
          car_id?: number;
          full_name?: string;
          email?: string;
          phone?: string;
          preferred_date?: string;
          notes?: string | null;
          created_at?: string;
          read?: boolean;
        };

        Relationships: [];
      };

      messages: {
        Row: {
          id: number;
          name: string;
          email: string;
          phonenumber: string | null;
          message: string;
          created_at: string;
          read: boolean;
        };

        Insert: {
          id?: number;
          name: string;
          email: string;
          phonenumber?: string | null;
          message: string;
          created_at?: string;
          read: boolean;
        };

        Update: {
          id?: number;
          name?: string;
          email?: string;
          phonenumber?: string | null;
          message?: string;
          created_at?: string;
          read?: boolean;
        };

        Relationships: [];
      };

      testimonials: {
        Row: {
          id: number;
          name: string;
          role: string;
          text: string;
          created_at: string;
        };

        Insert: {
          id?: number;
          name: string;
          role: string;
          text: string;
          created_at?: string;
        };

        Update: {
          id?: number;
          name?: string;
          role?: string;
          text?: string;
          created_at?: string;
        };

        Relationships: [];
      };
    };

    Views: {
      blog_public_post_authors: {
        Row: {
          author_name: string;
          post_id: string;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
