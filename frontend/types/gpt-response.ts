export interface GptResponse {
  question: {
    scenario: string;
    instruction: string;
  };
  options: string[];
  answer: string;
  explanation: {
    quote: {
      quote: String;
      citation: String;
    };
    paragraph: string;
    option_breakdown: {
      key: string;
      label: string;
      explanation: string;
    }[];
  };
  references: string[];
}
