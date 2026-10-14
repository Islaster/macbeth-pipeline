export type FileKind = "image" | "video" | "other";

const kindByExtension: Record<string, FileKind> = {
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  gif: "image",
  mp4: "video",
  mov: "video",
  webm: "video",
};

export function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? (parts.pop() ?? "").toLowerCase() : "";
}

export function getFileKind(fileName: string): FileKind {
  return kindByExtension[getFileExtension(fileName)] ?? "other";
}

// "000_AHK_0300_csh_30N_v0001.png" -> "v0001"
export function getVersionLabel(fileName: string): string | null {
  const match = /_(v\d{2,4})/i.exec(fileName);
  return match?.[1]?.toLowerCase() ?? null;
}

// "Assets/Characters/sheet.png" -> "Assets/Characters/"
export function getFolderPath(key: string): string {
  return key.slice(0, key.lastIndexOf("/") + 1);
}
