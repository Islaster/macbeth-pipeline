import { parseShotFileName } from "./parseShotFileName";

const maxPropertyBytes = 124; // Drive's limit for one name and its value together

function fitToLimit(name: string, value: string): string {
  let fitted = value;
  while (Buffer.byteLength(name + fitted, "utf8") > maxPropertyBytes) {
    fitted = fitted.slice(0, -1);
  }
  return fitted;
}

// The details saved on the Drive file itself (Drive calls these "properties").
// Every upload records the artist; the rest are added when the file name follows the pattern.
export function buildFileMetadata(
  artist: string,
  fileName: string
): Record<string, string> {
  const details = parseShotFileName(fileName);
  const metadata: Record<string, string> = { artist };
  if (details) {
    metadata.seq_id = details.seqId;
    metadata.shot_id = details.shotId;
    metadata.stage = details.stage;
  }

  for (const [name, value] of Object.entries(metadata)) {
    metadata[name] = fitToLimit(name, value);
  }
  return metadata;
}
