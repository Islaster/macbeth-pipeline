// XMP is the metadata format Adobe tools read. The artist is tiff:Artist, the same
// field EXIF calls Artist, so every tool shows it under that one name.

const tiffNamespace = "http://ns.adobe.com/tiff/1.0/";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function artistElement(artist: string): string {
  return `<tiff:Artist>${escapeXml(artist)}</tiff:Artist>`;
}

// A complete XMP packet naming the artist.
export function buildXmpPacket(artist: string): string {
  return (
    '<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>' +
    '<x:xmpmeta xmlns:x="adobe:ns:meta/">' +
    '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
    `<rdf:Description rdf:about="" xmlns:tiff="${tiffNamespace}">` +
    artistElement(artist) +
    "</rdf:Description></rdf:RDF></x:xmpmeta>" +
    '<?xpacket end="w"?>'
  );
}

// Sets the artist in an existing packet, keeping everything else in it.
export function setXmpArtist(xml: string, artist: string): string {
  // Already there as an element, or as an attribute of rdf:Description.
  if (/<tiff:Artist[\s>]/.test(xml)) {
    return xml.replace(
      /<tiff:Artist[\s\S]*?<\/tiff:Artist>/,
      artistElement(artist)
    );
  }
  if (/\stiff:Artist="/.test(xml)) {
    return xml.replace(
      /\stiff:Artist="[^"]*"/,
      ` tiff:Artist="${escapeXml(artist)}"`
    );
  }

  // Not there yet: add it to the first rdf:Description.
  const description = /<rdf:Description\b([^>]*?)(\/?)>/.exec(xml);
  if (!description) return buildXmpPacket(artist);

  const [tag, attributes = "", selfClosing] = description;
  const withNamespace = attributes.includes("xmlns:tiff=")
    ? attributes
    : `${attributes} xmlns:tiff="${tiffNamespace}"`;
  const opening = `<rdf:Description${withNamespace}>`;
  if (selfClosing) {
    return xml.replace(
      tag,
      `${opening}${artistElement(artist)}</rdf:Description>`
    );
  }
  return xml
    .replace(tag, opening)
    .replace(
      "</rdf:Description>",
      `${artistElement(artist)}</rdf:Description>`
    );
}
