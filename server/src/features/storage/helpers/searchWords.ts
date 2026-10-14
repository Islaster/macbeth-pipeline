export function toSearchWords(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

// True when every word appears somewhere in the name, in any order.
export function containsAllWords(name: string, words: string[]): boolean {
  const lowerName = name.toLowerCase();
  return words.every((word) => lowerName.includes(word));
}
