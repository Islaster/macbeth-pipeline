// One connection to the server's live-update stream, shared by every part of the file browser.

export type StorageEvent =
  | { type: "folders"; folders: string[] } // these folders' contents changed
  | { type: "all" } // paths may have changed; reload everything
  | { type: "index" }; // the search index was rebuilt

type Listener = (event: StorageEvent) => void;

const listeners = new Set<Listener>();
let source: EventSource | null = null;

function connect(): void {
  // EventSource reconnects by itself if the connection drops.
  source = new EventSource("/api/storage/events");
  source.onmessage = (message: MessageEvent<string>) => {
    let event: StorageEvent;
    try {
      event = JSON.parse(message.data) as StorageEvent;
    } catch {
      return; // not something we sent
    }
    for (const listener of listeners) listener(event);
  };
}

// Starts listening; returns a function that stops. The connection opens with the
// first listener and closes when the last one leaves.
export function subscribeToStorageEvents(listener: Listener): () => void {
  listeners.add(listener);
  if (!source) connect();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      source?.close();
      source = null;
    }
  };
}

// True when an event means the contents of `folder` ("" for the top level) may have changed.
export function affectsFolder(event: StorageEvent, folder: string): boolean {
  if (event.type === "all") return true;
  if (event.type !== "folders") return false;
  const path = folder === "" || folder.endsWith("/") ? folder : `${folder}/`;
  return event.folders.includes(path);
}
