import { useEffect, useState } from "react";
import type { StoredFolder } from "../../../../../shared/types/storedFile";
import { fetchFolderContents } from "../api/storageApi";
import { affectsFolder, subscribeToStorageEvents } from "../api/storageEvents";

// Each folder directly inside Scene_Bin/ is one sequence,
// e.g. "Scene_Bin/006_(HKA)_HONG_KONG_ATTACK/".
const sequencesFolder = "Scene_Bin/";

async function fetchAllSequences(): Promise<StoredFolder[]> {
  const sequences: StoredFolder[] = [];
  let cursor: string | undefined;
  do {
    const page = await fetchFolderContents(sequencesFolder, cursor);
    sequences.push(...page.folders);
    cursor = page.nextCursor ?? undefined;
  } while (cursor);
  return sequences;
}

export function useSequences(): StoredFolder[] {
  const [sequences, setSequences] = useState<StoredFolder[]>([]);
  const [version, setVersion] = useState(0); // bumped when the sequences folder changes

  useEffect(
    () =>
      subscribeToStorageEvents((event) => {
        if (affectsFolder(event, sequencesFolder))
          setVersion((current) => current + 1);
      }),
    []
  );
  useEffect(() => {
    let isCurrent = true;
    fetchAllSequences()
      .then((found) => {
        if (isCurrent) setSequences(found);
      })
      .catch(() => {
        // The sidebar shows "No sequences found" when the list stays empty.
      });
    return () => {
      isCurrent = false;
    };
  }, [version]);

  return sequences;
}
