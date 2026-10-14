import {
  ascii,
  concat,
  readAscii,
  readUint32,
  startsWith,
  uint32,
  utf8,
  utf8Decoder,
} from "./bytes";
import { buildXmpPacket, setXmpArtist } from "./xmp";

// PNG files are a signature followed by chunks: length, type, data, CRC.
// The artist goes in an "Artist" text chunk, and in an XMP packet for Adobe tools.

const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const xmpKeyword = "XML:com.adobe.xmp";
const textChunkTypes = ["tEXt", "zTXt", "iTXt"];

interface Chunk {
  type: string;
  data: Uint8Array;
}

const crcTable = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(...parts: Uint8Array[]): number {
  let crc = 0xffffffff;
  for (const part of parts) {
    for (const byte of part) crc = crcTable[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function isPng(bytes: Uint8Array): boolean {
  return startsWith(bytes, signature);
}

function readChunks(bytes: Uint8Array): Chunk[] {
  const chunks: Chunk[] = [];
  let offset = signature.length;
  while (offset + 8 <= bytes.length) {
    const length = readUint32(bytes, offset);
    const type = readAscii(bytes, offset + 4, 4);
    chunks.push({
      type,
      data: bytes.subarray(offset + 8, offset + 8 + length),
    });
    offset += 12 + length;
  }
  return chunks;
}

function writeChunk({ type, data }: Chunk): Uint8Array {
  const typeBytes = ascii(type);
  return concat([
    uint32(data.length),
    typeBytes,
    data,
    uint32(crc32(typeBytes, data)),
  ]);
}

// Text chunks start with their keyword, ended by a zero byte.
function keywordOf(chunk: Chunk): string {
  if (!textChunkTypes.includes(chunk.type)) return "";
  const end = chunk.data.indexOf(0);
  return readAscii(chunk.data, 0, end === -1 ? chunk.data.length : end);
}

// iTXt: keyword, 0, compression flag, compression method, language tag, 0, translated keyword, 0, text (UTF-8).
function internationalText(keyword: string, text: string): Chunk {
  return {
    type: "iTXt",
    data: concat([
      ascii(keyword),
      new Uint8Array([0, 0, 0, 0, 0]),
      utf8.encode(text),
    ]),
  };
}

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([new Uint8Array(data)]) // the plain copy Blob asks for
    .stream()
    .pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// The text of a tEXt, zTXt or iTXt chunk, decompressed when needed.
async function readText(chunk: Chunk): Promise<string> {
  const keywordEnd = chunk.data.indexOf(0);
  if (chunk.type === "tEXt")
    return utf8Decoder.decode(chunk.data.subarray(keywordEnd + 1));
  if (chunk.type === "zTXt") {
    return utf8Decoder.decode(
      await inflate(chunk.data.subarray(keywordEnd + 2)) // past the method byte
    );
  }
  const isCompressed = chunk.data[keywordEnd + 1] === 1;
  let offset = keywordEnd + 3; // past the compression flag and method
  offset = chunk.data.indexOf(0, offset) + 1; // past the language tag
  offset = chunk.data.indexOf(0, offset) + 1; // past the translated keyword
  const text = chunk.data.subarray(offset);
  return utf8Decoder.decode(isCompressed ? await inflate(text) : text);
}

export async function setPngArtist(
  bytes: Uint8Array,
  artist: string
): Promise<Uint8Array> {
  const chunks = readChunks(bytes);
  const existingXmp = chunks.find((chunk) => keywordOf(chunk) === xmpKeyword);
  const xmp = existingXmp
    ? setXmpArtist(await readText(existingXmp), artist)
    : buildXmpPacket(artist);

  const kept = chunks.filter(
    (chunk) => !["Artist", xmpKeyword].includes(keywordOf(chunk))
  );
  const headerIndex = kept.findIndex((chunk) => chunk.type === "IHDR");
  kept.splice(
    headerIndex + 1,
    0,
    internationalText("Artist", artist),
    internationalText(xmpKeyword, xmp)
  );

  return concat([Uint8Array.from(signature), ...kept.map(writeChunk)]);
}
