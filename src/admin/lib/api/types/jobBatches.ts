export interface JobBatch {
    id: string;
    name: string;
    total_jobs: number;
    pending_jobs: number;
    failed_jobs: number;
    failed_job_ids: string;
    options: string | null;
    cancelled_at: number | null;
    created_at: number;
    finished_at: number | null;
  }
  export interface JobBatchFormData {
    name: string;
    total_jobs: number;
    pending_jobs: number;
    failed_jobs: number;
    failed_job_ids: string;
    options?: string | null;
    cancelled_at?: number | null;
    created_at: number;
    finished_at?: number | null;
  }