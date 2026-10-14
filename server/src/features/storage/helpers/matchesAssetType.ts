import type {
  AssetType,
  StoredFile,
} from "../../../../../shared/types/storedFile";

// "csh" as its own part of the file name: "000_AHK_0300_csh_30N_v0001.png".
const characterSheetPattern = /(^|[_\-. ])csh([_\-. ]|$)/i;

export function matchesAssetType(
  file: StoredFile,
  assetType: AssetType
): boolean {
  switch (assetType) {
    case "characterSheets":
      return characterSheetPattern.test(file.name);
    case "props":
      return file.key.toLowerCase().includes("props");
  }
}
