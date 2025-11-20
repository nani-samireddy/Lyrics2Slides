
/**
 * Deterministically cleans lyrics using Regex rules.
 * Useful for offline processing or pre-cleaning.
 */
export const cleanLyricsDeterministically = (text: string): string => {
  let cleaned = text;

  // 1. Remove verse numbers (e.g., "1.", "2.", "12.") at the start of lines
  cleaned = cleaned.replace(/^\s*\d+\.?\s*/gm, "");

  // 2. Remove section labels (Pallavi:, Chorus:, etc.) - Case insensitive
  // English labels
  cleaned = cleaned.replace(/^(?:pallavi|chorus|charanam|bridge|verse|anupallavi)\s*[:\-]?\s*/gmi, "");
  // Telugu labels (పల్లవి, చరణం, అనుపల్లవి)
  cleaned = cleaned.replace(/^(?:పల్లవి|చరణం|అనుపల్లవి)\s*[:\-]?\s*/gmi, "");

  // 3. Remove repeat markers and metadata
  cleaned = cleaned.replace(/\(.*\d+.*\)/g, ""); // (2), (2x), (Repeat)
  cleaned = cleaned.replace(/\[.*\]/g, ""); // [Repeat]
  cleaned = cleaned.replace(/\|\|.*?\|\|/g, ""); // ||...|| (Chorus reference)
  
  // 4. Join split words (Hyphens within words) e.g. మ-హి-మ -> మహిమ
  // This logic looks for a hyphen surrounded by non-whitespace characters OR 
  // a hyphen followed by a newline/space which is meant to continue a word.
  // For Telugu, simplest heuristic is removing hyphens that aren't clearly separating full phrases.
  cleaned = cleaned.replace(/(\S)\s*-\s*(\S)/g, "$1$2");
  // Also remove multiple hyphens often used for visual separation
  cleaned = cleaned.replace(/[-—]{2,}/g, " ");

  // 5. Remove trailing/leading whitespace on each line
  cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');

  // 6. Normalize newlines (max 1 empty line)
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
};
