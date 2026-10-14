import { concat, startsWith, utf8, utf8Decoder } from "./bytes";
import { buildXmpPacket, setXmpArtist } from "./xmp";

// JPEG files are a series of segments (marker, length, data) ahead of the picture data.
// The artist goes in an XMP segment, which Photoshop, Bridge, Lightroom and exiftool read.

const xmpHeader = "http://ns.adobe.com/xap/1.0/\0";
const startOfScan = 0xda;

interface Segment {
  marker: number;
  bytes: Uint8Array; // the whole segment: FF, marker, length, data
}

export function isJpeg(bytes: Uint8Array): boolean {
  return startsWith(bytes, [0xff, 0xd8]);
}

// Reads the segments before the picture data; returns them and where that data begins.
function readSegments(bytes: Uint8Array): {
  segments: Segment[];
  rest: Uint8Array;
} {
  const segments: Segment[] = [];
  let offset = 2; // past the start-of-image marker
  while (offset + 4 <= bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1]!;
    if (marker === startOfScan) break;
    const length = (bytes[offset + 2]! << 8) | bytes[offset + 3]!;
    segments.push({
      marker,
      bytes: bytes.subarray(offset, offset + 2 + length),
    });
    offset += 2 + length;
  }
  return { segments, rest: bytes.subarray(offset) };
}

function isXmpSegment(segment: Segment): boolean {
  return (
    segment.marker === 0xe1 &&
    utf8Decoder.decode(segment.bytes.subarray(4, 4 + xmpHeader.length)) ===
      xmpHeader
  );
}

function xmpSegment(xml: string): Segment {
  const data = concat([utf8.encode(xmpHeader), utf8.encode(xml)]);
  const length = data.length + 2;
  return {
    marker: 0xe1,
    bytes: concat([
      new Uint8Array([0xff, 0xe1, length >> 8, length & 0xff]),
      data,
    ]),
  };
}

export function setJpegArtist(bytes: Uint8Array, artist: string): Uint8Array {
  const { segments, rest } = readSegments(bytes);
  const existing = segments.find(isXmpSegment);
  const xmp = existing
    ? setXmpArtist(
        utf8Decoder.decode(existing.bytes.subarray(4 + xmpHeader.length)),
        artist
      )
    : buildXmpPacket(artist);

  const kept = segments.filter((segment) => !isXmpSegment(segment));
  // Goes after any JFIF/EXIF segments, which readers expect to come first.
  let insertAt = 0;
  while (
    insertAt < kept.length &&
    (kept[insertAt]!.marker === 0xe0 || kept[insertAt]!.marker === 0xe1)
  ) {
    insertAt += 1;
  }
  kept.splice(insertAt, 0, xmpSegment(xmp));

  return concat([
    bytes.subarray(0, 2),
    ...kept.map((segment) => segment.bytes),
    rest,
  ]);
}
