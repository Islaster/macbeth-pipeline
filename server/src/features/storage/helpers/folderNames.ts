// Rules for folder paths ("Assets/Characters/", or "" for the top level) and new folder names.

export function isValidFolderPath(path: string): boolean {
  if (path === "") return true; // the top level
  return (
    path.endsWith("/") &&
    !path.startsWith("/") &&
    !path.includes("//") &&
    !path.split("/").includes("..")
  );
}

export function isValidFolderName(name: string): boolean {
  return (
    name.length > 0 &&
    name.length <= 255 &&
    name === name.trim() &&
    !/[\\/]/.test(name) &&
    name !== "." &&
    name !== ".."
  );
}
