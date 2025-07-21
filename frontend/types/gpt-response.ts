export interface GptResponse {
  question: {
    scenario: string;
    instruction: string;
  };
  options: string[];
  answer: string;
  explanation: {
    paragraph: string;
    option_breakdown: {
      option: string;
      explanation: string;
      correct: boolean;
    }[];
  };
  references: string[];
}
