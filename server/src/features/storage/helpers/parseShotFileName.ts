export interface ShotFileDetails {
  seqId: string;
  shotId: string;
  number: string;
  stage: string;
  version: string;
}

export interface ShotFileNameCheck {
  details: ShotFileDetails | null; // null when the name doesn't follow the pattern
  problems: string[]; // what to fix, in plain words; empty when the name is fine
}

export const shotFileNamePattern = "sequence_shot_number_stage_version";
export const shotFileNameExample = "MAC_SC01_001_WIP_V001.mp4";

// The five parts of a shot file name, in order, and what each must look like.
// "MAC_SC01_001_WIP_V001.mp4" -> seqId "MAC", shotId "SC01", number "001", stage "WIP", version "V001"
const nameParts = [
  {
    key: "seqId",
    rule: /^[A-Za-z][A-Za-z0-9]*$/,
    hint: 'the sequence, letters like "MAC"',
  },
  {
    key: "shotId",
    rule: /^SC\d+[A-Za-z]?$/i,
    hint: 'the shot, "SC" and a number like "SC01"',
  },
  { key: "number", rule: /^\d+$/, hint: 'a number like "001"' },
  {
    key: "stage",
    rule: /^[A-Za-z][A-Za-z0-9]*$/,
    hint: 'the stage, like "WIP"',
  },
  {
    key: "version",
    rule: /^V\d+$/i,
    hint: 'the version, "V" and a number like "V001"',
  },
] as const;

// Checks a file name one part at a time, so each problem can be explained on its own.
export function checkShotFileName(fileName: string): ShotFileNameCheck {
  const name = fileName.replace(/\.[^.]+$/, ""); // without the extension
  const parts = name.split("_");

  if (parts.length !== nameParts.length) {
    const problems = [
      `It needs ${nameParts.length} parts joined by underscores (${shotFileNamePattern}). This name has ${parts.length}.`,
    ];
    if (/[\s-]/.test(name)) {
      problems.push(
        'The parts must be joined with underscores ("_"), not spaces or dashes.'
      );
    }
    return { details: null, problems };
  }

  const problems: string[] = [];
  const found: Record<string, string> = {};
  nameParts.forEach((part, index) => {
    const value = parts[index] ?? "";
    if (part.rule.test(value)) found[part.key] = value.toUpperCase();
    else
      problems.push(
        `Part ${index + 1} must be ${
          part.hint
        }. This name has "${value}" there.`
      );
  });

  const { seqId, shotId, number, stage, version } = found;
  if (!seqId || !shotId || !number || !stage || !version)
    return { details: null, problems };
  return { details: { seqId, shotId, number, stage, version }, problems };
}

// Returns null when the name doesn't follow the pattern.
export function parseShotFileName(fileName: string): ShotFileDetails | null {
  return checkShotFileName(fileName).details;
}
