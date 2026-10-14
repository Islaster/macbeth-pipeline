import { isJpeg, setJpegArtist } from "./jpegMetadata";
import { isMp4, setMp4ArtistInFile } from "./mp4Metadata";
import { isPng, setPngArtist } from "./pngMetadata";

const largestImageBytes = 300 * 1024 * 1024; // images bigger than this are left untouched

async function readStart(file: File, length: number): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(0, length).arrayBuffer());
}

// Writes the name into the file's own metadata as "Artist", the same field in every
// format. Files in formats this doesn't know (WebP, GIF, WebM, anything else) come
// back unchanged, as does a file that can't be read.
export async function embedArtist(file: File, artist: string): Promise<Blob> {
  try {
    const start = await readStart(file, 16);
    if (isMp4(start)) return await setMp4ArtistInFile(file, artist);
    if (file.size > largestImageBytes) return file;

    const bytes = new Uint8Array(await file.arrayBuffer());
    // new Uint8Array(...) makes the plain copy Blob asks for.
    if (isPng(bytes))
      return new Blob([new Uint8Array(await setPngArtist(bytes, artist))]);
    if (isJpeg(bytes))
      return new Blob([new Uint8Array(setJpegArtist(bytes, artist))]);
    return file;
  } catch (error) {
    console.warn(
      `Couldn't write the artist into ${file.name}; uploading it as is.`,
      error
    );
    return file;
  }
}
