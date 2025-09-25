const BACK_JOB_BATCHES_ENDPOINTS = {
  BASE: '/back/v1/job-batches',
  getAllJobBatches: () => `${BACK_JOB_BATCHES_ENDPOINTS.BASE}`,
  getJobBatchById: (id: string) => `${BACK_JOB_BATCHES_ENDPOINTS.BASE}/${id}`,
  createJobBatch: () => `${BACK_JOB_BATCHES_ENDPOINTS.BASE}`,
  updateJobBatch: (id: string) => `${BACK_JOB_BATCHES_ENDPOINTS.BASE}/${id}`,
  deleteJobBatch: (id: string) => `${BACK_JOB_BATCHES_ENDPOINTS.BASE}/${id}`,
};
export default BACK_JOB_BATCHES_ENDPOINTS