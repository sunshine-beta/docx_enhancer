import type { GptResponse } from "./gpt-response";

export interface Question {
  _id: string;
  question: string;
  options: string[];
  correctAnswerRaw?: string;
  explanation?: string;
  references?: string[];
  gptResponse?: GptResponse | string;
}
