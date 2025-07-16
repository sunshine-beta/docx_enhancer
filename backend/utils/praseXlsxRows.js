import * as XLSX from "xlsx";

export function parseXlsxRows(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Step 1: Read structured rows using headers
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  console.log("Raw Rows (first 5):", rawRows.slice(0, 5));

  // Step 2: Filter out completely empty rows
  const rows = rawRows.filter((row) =>
    Object.values(row).some(
      (cell) => cell !== "" && cell !== null && cell !== undefined
    )
  );

  console.log("Total valid rows after filtering:", rows.length);

  const parsed = rows
    .map((row, rowIndex) => {
      const question = (row["Question"] || "").toString().trim();
      const optionsText = (row["Options"] || "").toString().trim();
      const correctAnswer = (row["Answer"] || "").toString().trim();
      const explanation = (row["Explanation"] || "").toString().trim();
      const references = (row["References"] || "").toString().trim();

      if (!question || !optionsText || !correctAnswer) {
        console.warn(
          `⚠️ Skipping row ${rowIndex + 2} - missing required fields`
        );
        return null;
      }

      const options = optionsText
        .split(/(?=[A-E][\).]\s)/g) // Matches A) or A. followed by space
        .map((opt) => opt.replace(/^[A-E][\).]\s*/, "").trim())
        .filter((opt) => opt.length > 0);

      if (!Array.isArray(options) || options.length < 2) {
        console.warn(
          `⚠️ Skipping row ${rowIndex + 2} - invalid or too few options`
        );
        return null;
      }

      return {
        question,
        options,
        correctAnswerRaw: correctAnswer,
        explanation,
        references: references
          .split(",")
          .map((ref) => ref.trim())
          .filter((ref) => ref.length > 0),
      };
    })
    .filter(Boolean);

  console.log(`✅ Parsed rows count: ${parsed.length}`);
  return parsed;
}
