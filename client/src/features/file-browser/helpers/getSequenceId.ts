// "006_(HKA)_HONG_KONG_ATTACK" -> "006_HKA"
// Folders that don't follow that pattern keep their full name.
export function getSequenceId(sequenceFolderName: string): string {
  const match = /^(\d+)_\(([^)]+)\)/.exec(sequenceFolderName);
  return match ? `${match[1]}_${match[2]}` : sequenceFolderName;
}
