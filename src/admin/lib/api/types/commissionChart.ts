export interface CommissionFile {
  id: number;
  category_id: number;
  commission_file: string;
  file_name?: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
  category?: {
    id: number;
    name: string;
  };
}

export interface CommissionChartListResponse {
  data: CommissionFile[];
}

export interface CommissionChartUploadRequest {
  category_id: string | number;
  commission_file: File;
}

export interface CommissionChartUpdateRequest {
  category_id?: string | number;
  commission_file?: File;
}

