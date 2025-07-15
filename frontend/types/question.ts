export interface Question {
  _id: string;
  question: string;
  options: string[];
  correctAnswerRaw?: string;
  explanation?: string;
  references?: string[];
  gptResponse?: {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
    references: string[];
  };
}
