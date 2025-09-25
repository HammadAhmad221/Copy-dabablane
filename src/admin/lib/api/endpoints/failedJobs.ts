const BASE_URL = '/back/v1/failed_jobs'; // Changed to "failed_jobs"

const BACK_FAILED_JOB_ENDPOINTS = {
  BASE: BASE_URL,
  getAllFailedJobs: () => BASE_URL, // Retrieves all failed jobs
  getFailedJobById: (id: string) => `${BASE_URL}/${id}`, // Retrieves a specific failed job by ID
  createFailedJob: () => BASE_URL, // Creates a new failed job (if necessary)
  updateFailedJob: (id: string) => `${BASE_URL}/${id}`, // Updates a specific failed job by ID
  deleteFailedJob: (id: string) => `${BASE_URL}/${id}`, // Deletes a specific failed job by ID
};

export default BACK_FAILED_JOB_ENDPOINTS;
