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
          email: string
          full_name: string | null
          role: 'admin' | 'employee'
          position: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'employee'
          position?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'employee'
          position?: string | null
          created_at?: string
        }
      }
      vacations: {
        Row: {
          id: string
          user_id: string
          type: 'годишен' | 'боледување' | 'слободен ден'
          date_from: string
          date_to: string
          days_total: number
          comment: string | null
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'годишен' | 'боледување' | 'слободен ден'
          date_from: string
          date_to: string
          days_total: number
          comment?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'годишен' | 'боледување' | 'слободен ден'
          date_from?: string
          date_to?: string
          days_total?: number
          comment?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          is_read?: boolean
          created_at?: string
        }
      }
    }
  }
}
