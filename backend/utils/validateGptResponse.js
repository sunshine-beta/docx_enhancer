export function isValidGptResponse(parsed) {
  return (
    parsed.question?.scenario &&
    parsed.question?.instruction &&
    Array.isArray(parsed.options) &&
    typeof parsed.answer === "string" &&
    parsed.explanation?.paragraph &&
    Array.isArray(parsed.explanation?.option_breakdown)
  );
}
