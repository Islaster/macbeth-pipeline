import { ascii, concat, readAscii, readUint32, uint32, utf8 } from "./bytes";

// MP4 and MOV files are nested "atoms": size, type, contents. The artist lives at
// moov/udta/meta/ilst/©ART, the place iTunes, QuickTime, Finder and ffmpeg all read.
// Adding it makes moov bigger; if moov sits before the picture data, every chunk
// offset in the file has to be moved along by the same amount.

interface Atom {
  type: string;
  start: number; // within its parent
  end: number;
  headerSize: number; // 8, or 16 for 64-bit sizes
}

const artistType = "\u00a9ART";

function readAtoms(bytes: Uint8Array, from = 0, to = bytes.length): Atom[] {
  const atoms: Atom[] = [];
  let offset = from;
  while (offset + 8 <= to) {
    let size = readUint32(bytes, offset);
    let headerSize = 8;
    if (size === 1) {
      // 64-bit size; the high half is always 0 for files under 4 GB
      size =
        readUint32(bytes, offset + 8) * 2 ** 32 +
        readUint32(bytes, offset + 12);
      headerSize = 16;
    } else if (size === 0) {
      size = to - offset; // runs to the end
    }
    if (size < headerSize) break; // damaged; stop rather than loop forever
    atoms.push({
      type: readAscii(bytes, offset + 4, 4),
      start: offset,
      end: offset + size,
      headerSize,
    });
    offset += size;
  }
  return atoms;
}

function makeAtom(type: string, payload: Uint8Array): Uint8Array {
  return concat([uint32(8 + payload.length), ascii(type), payload]);
}

// "meta" normally has 4 bytes of version and flags before its children, but some
// QuickTime files leave them out. The first child is always "hdlr", which tells us.
function metaPrefixLength(payload: Uint8Array): number {
  return readAscii(payload, 4, 4) === "hdlr" ? 0 : 4;
}

// Rebuilds a container with one child replaced (or added at the end when missing).
function withChild(
  container: Uint8Array,
  prefixLength: number,
  type: string,
  rebuild: (existing: Uint8Array | null) => Uint8Array
): Uint8Array {
  const children = readAtoms(container, prefixLength);
  const parts: Uint8Array[] = [container.subarray(0, prefixLength)];
  let found = false;
  for (const child of children) {
    const childBytes = container.subarray(child.start, child.end);
    if (child.type === type && !found) {
      parts.push(rebuild(childBytes));
      found = true;
    } else {
      parts.push(childBytes);
    }
  }
  if (!found) parts.push(rebuild(null));
  return concat(parts);
}

function artistAtom(artist: string): Uint8Array {
  // "data" atom: type 1 (UTF-8 text), locale 0, then the text.
  const data = makeAtom(
    "data",
    concat([uint32(1), uint32(0), utf8.encode(artist)])
  );
  return makeAtom(artistType, data);
}

function metadataHandler(): Uint8Array {
  // version/flags, pre-defined, handler "mdir", manufacturer "appl", reserved, empty name.
  return makeAtom(
    "hdlr",
    concat([
      uint32(0),
      uint32(0),
      ascii("mdir"),
      ascii("appl"),
      new Uint8Array(9),
    ])
  );
}

// The header is 8 bytes, or 16 when the size needs 64 bits.
function contentsOf(atom: Uint8Array): Uint8Array {
  return atom.subarray(readUint32(atom, 0) === 1 ? 16 : 8);
}

function rebuildIlst(existing: Uint8Array | null, artist: string): Uint8Array {
  const payload = existing ? contentsOf(existing) : new Uint8Array(0);
  return makeAtom(
    "ilst",
    withChild(payload, 0, artistType, () => artistAtom(artist))
  );
}

function rebuildMeta(existing: Uint8Array | null, artist: string): Uint8Array {
  if (!existing) {
    return makeAtom(
      "meta",
      concat([uint32(0), metadataHandler(), rebuildIlst(null, artist)])
    );
  }
  const payload = contentsOf(existing);
  const prefix = metaPrefixLength(payload);
  return makeAtom(
    "meta",
    withChild(payload, prefix, "ilst", (ilst) => rebuildIlst(ilst, artist))
  );
}

function rebuildUdta(existing: Uint8Array | null, artist: string): Uint8Array {
  const payload = existing ? contentsOf(existing) : new Uint8Array(0);
  return makeAtom(
    "udta",
    withChild(payload, 0, "meta", (meta) => rebuildMeta(meta, artist))
  );
}

// Adds `delta` to every chunk offset at or past `movedFrom`, inside the given moov.
function shiftChunkOffsets(
  moov: Uint8Array,
  movedFrom: number,
  delta: number
): void {
  const view = new DataView(moov.buffer, moov.byteOffset, moov.byteLength);
  const visit = (from: number, to: number) => {
    for (const atom of readAtoms(moov, from, to)) {
      const payloadStart = atom.start + atom.headerSize;
      if (atom.type === "stco" || atom.type === "co64") {
        const count = view.getUint32(payloadStart + 4);
        for (let i = 0; i < count; i += 1) {
          const at = payloadStart + 8 + i * (atom.type === "stco" ? 4 : 8);
          if (atom.type === "stco") {
            const offset = view.getUint32(at);
            if (offset >= movedFrom) view.setUint32(at, offset + delta);
          } else {
            const offset = Number(view.getBigUint64(at));
            if (offset >= movedFrom)
              view.setBigUint64(at, BigInt(offset + delta));
          }
        }
      } else if (["trak", "mdia", "minf", "stbl"].includes(atom.type)) {
        visit(payloadStart, atom.end);
      }
    }
  };
  visit(8, moov.length);
}

export function isMp4(bytes: Uint8Array): boolean {
  return bytes.length >= 12 && readAscii(bytes, 4, 4) === "ftyp";
}

// A new moov with the artist set. `moovEnd` is where the old moov ended in the file,
// so chunk offsets past it can be moved along by however much moov grew.
export function rebuildMoov(
  oldMoov: Uint8Array,
  moovEnd: number,
  artist: string
): Uint8Array {
  const headerSize = readUint32(oldMoov, 0) === 1 ? 16 : 8;
  // Copied, so the offset shift below can't touch the original bytes.
  const newMoov = Uint8Array.from(
    makeAtom(
      "moov",
      withChild(oldMoov.subarray(headerSize), 0, "udta", (udta) =>
        rebuildUdta(udta, artist)
      )
    )
  );
  const delta = newMoov.length - oldMoov.length;
  if (delta !== 0) shiftChunkOffsets(newMoov, moovEnd, delta);
  return newMoov;
}

export function setMp4Artist(bytes: Uint8Array, artist: string): Uint8Array {
  const moov = readAtoms(bytes).find((atom) => atom.type === "moov");
  if (!moov) return bytes; // not a playable file; leave it alone

  const newMoov = rebuildMoov(
    bytes.subarray(moov.start, moov.end),
    moov.end,
    artist
  );
  return concat([
    bytes.subarray(0, moov.start),
    newMoov,
    bytes.subarray(moov.end),
  ]);
}

// Same, for a File: only moov is read into memory, so a multi-gigabyte video is fine.
// The rest of the file is passed through untouched.
export async function setMp4ArtistInFile(
  file: File,
  artist: string
): Promise<Blob> {
  let offset = 0;
  while (offset + 8 <= file.size) {
    const header = new Uint8Array(
      await file.slice(offset, offset + 16).arrayBuffer()
    );
    let size = readUint32(header, 0);
    if (size === 1)
      size = readUint32(header, 8) * 2 ** 32 + readUint32(header, 12);
    else if (size === 0) size = file.size - offset;
    if (size < 8) break; // damaged; leave the file alone

    if (readAscii(header, 4, 4) === "moov") {
      const oldMoov = new Uint8Array(
        await file.slice(offset, offset + size).arrayBuffer()
      );
      const newMoov = rebuildMoov(oldMoov, offset + size, artist);
      return new Blob([
        file.slice(0, offset),
        new Uint8Array(newMoov), // the plain copy Blob asks for
        file.slice(offset + size),
      ]);
    }
    offset += size;
  }
  return file; // no moov found; leave it alone
}
