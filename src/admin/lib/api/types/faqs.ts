export interface Faq {
    id: string; // bigint(20), unique identifier for the FAQ
    question: string; // text, the question being asked
    answer: string; // text, the answer to the question
    created_at: string; // timestamp, the time when the FAQ was created
    updated_at: string; // timestamp, the last time the FAQ was updated
  }
  