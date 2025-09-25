export interface FailedJob {
    id: string; // bigint(20), unique identifier for the failed job
    uuid: string; // varchar(255), a unique identifier for the job
    connection: string; // text, the connection used for the job (e.g., database, queue connection)
    queue: string; // text, the name of the queue where the job is pushed
    payload: string; // longtext, the job payload (data sent with the job)
    exception: string; // longtext, the exception message if the job fails
    failed_at: string; // timestamp, the time when the job failed
  }
  