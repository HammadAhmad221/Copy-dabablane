const FRONT_JOBS_ENDPOINTS = {
  BASE: '/back/v1/jobs',
  getAllJobs: () => `${FRONT_JOBS_ENDPOINTS.BASE}`,
  getJobById: (id: string) => `${FRONT_JOBS_ENDPOINTS.BASE}/${id}`,
  createJob: () => `${FRONT_JOBS_ENDPOINTS.BASE}`,
  updateJob: (id: string) => `${FRONT_JOBS_ENDPOINTS.BASE}/${id}`,
  deleteJob: (id: string) => `${FRONT_JOBS_ENDPOINTS.BASE}/${id}`,
};

export default FRONT_JOBS_ENDPOINTS;