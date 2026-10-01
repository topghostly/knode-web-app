/** First few characters of a question's prose, for the margin index. */
export function questionExcerpt(markdown: string, length = 10): string {
  let inFence = false;
  let firstProse = "";
  for (const raw of markdown.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence || !line || line.startsWith("|") || /^[-*_]{3,}$/.test(line)) continue;
    firstProse = line;
    break;
  }
  const plain = firstProse
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_~#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= length) return plain;
  return `${plain.slice(0, length).trimEnd()}…`;
}
