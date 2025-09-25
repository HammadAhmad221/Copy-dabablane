export interface Job {
    id: string;
    queue: string;
    payload: string;
    attempts: number;
    reserved_at: number | null;
    available_at: number;
    created_at: number;
  }
export interface JobFormData {
    queue: string;
    payload: string;
    attempts: number;
    reserved_at?: number | null;
    available_at: number;
    created_at: number;
  }