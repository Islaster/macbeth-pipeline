import { useState } from "react";
import type { StoredFile } from "../../../../shared/types/storedFile";
import { FileList } from "./components/FileList";
import { FilePreviewPanel } from "./components/FilePreviewPanel";
import { FilterSidebar } from "./components/FilterSidebar";
import { FolderBreadcrumbs } from "./components/FolderBreadcrumbs";
import { FolderList } from "./components/FolderList";
import { SearchBar } from "./components/SearchBar";
import {
  emptyFileFilters,
  filterFilesByKind,
  type FileFilters,
} from "./helpers/fileFilters";
import { useFolderContents } from "./hooks/useFolderContents";
import { useSequences } from "./hooks/useSequences";
import { useStorageSearch } from "./hooks/useStorageSearch";
import { ViewModeButtons } from "./components/ViewModeButtons";
import { ViewModeContext } from "./helpers/viewMode";
import { useSavedViewMode } from "./hooks/useViewMode";
import { UploadTray } from "./components/UploadTray";
import { UploadsContext } from "./helpers/uploads";
import { usePreventStrayFileDrops, useUploads } from "./hooks/useUploads";
import { NamingConventionModal } from "./components/NamingConventionModal";
import "./fileBrowser.css";

export function FileBrowser() {
  const [folder, setFolder] = useState(""); // "" is the top level
  const [selectedFile, setSelectedFile] = useState<StoredFile | null>(null);
  const [filters, setFilters] = useState<FileFilters>(emptyFileFilters);
  const [viewMode, setViewMode] = useSavedViewMode();

  const browse = useFolderContents(folder);
  const sequences = useSequences();
  const search = useStorageSearch(filters);
  const {
    uploads,
    uploadFiles,
    clearFinished,
    namingHelpFor,
    closeNamingHelp,
  } = useUploads();
  usePreventStrayFileDrops();
  const isSearching = search.isActive; // search text or a chosen sequence replaces the folder view
  const isFolderSearch = isSearching && filters.searchTarget === "folders";

  function openFolder(path: string) {
    setSelectedFile(null);
    // Going to a folder leaves the search: clear the text and sequence, keep the rest.
    setFilters((current) => ({
      ...current,
      searchText: "",
      sequencePath: null,
      assetType: null,
    }));
    setFolder(path);
  }

  // Browsing shows the open folder; searching shows only the kind of thing searched for.
  let sourceFiles = browse.files;
  let visibleFolders = browse.folders;
  if (isSearching) {
    sourceFiles = isFolderSearch ? [] : search.results.files;
    visibleFolders = isFolderSearch ? search.results.folders : [];
  }
  const visibleFiles = filterFilesByKind(sourceFiles, filters.kind);

  const shownCount = isFolderSearch
    ? visibleFolders.length
    : visibleFiles.length;
  const totalCount = isSearching
    ? search.results.totalMatches
    : browse.files.length;
  const returnedCount =
    search.results.files.length + search.results.folders.length;

  const error = isSearching ? search.error : browse.error;
  // While searching, keep the previous results on screen instead of flashing "Loading".
  const isLoading = isSearching
    ? search.isSearching &&
      sourceFiles.length === 0 &&
      visibleFolders.length === 0
    : browse.isLoading;
  const isReady = !isLoading && !error;
  const hasNothingToShow =
    isReady && visibleFolders.length === 0 && visibleFiles.length === 0;
  const hasMoreMatches =
    isSearching && search.results.totalMatches > returnedCount;
  const isIndexBuilding = isSearching && !search.results.isIndexReady;

  return (
    <ViewModeContext.Provider value={viewMode}>
      <UploadsContext.Provider value={uploadFiles}>
        <div className="file-browser">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            sequences={sequences}
            isKindFilterDisabled={isFolderSearch}
          />

          <main className="file-browser__main">
            <FolderBreadcrumbs folder={folder} onNavigate={openFolder} />
            <div className="file-browser__toolbar">
              <SearchBar
                filters={filters}
                onChange={setFilters}
                shownCount={shownCount}
                totalCount={totalCount}
                countLabel={isFolderSearch ? "folders" : "files"}
              />
              <ViewModeButtons viewMode={viewMode} onChange={setViewMode} />
            </div>

            {error && (
              <p className="file-browser__message file-browser__message--error">
                {error}
              </p>
            )}
            {isLoading && <p className="file-browser__message">Loading…</p>}
            {isIndexBuilding && (
              <p className="file-browser__message">
                Reading your storage. Results will appear here on their own in a
                moment.
              </p>
            )}
            {hasNothingToShow && !isIndexBuilding && (
              <p className="file-browser__message">
                {isSearching
                  ? `No ${filters.searchTarget} match your search.`
                  : "Nothing to show in this folder."}
              </p>
            )}
            {hasMoreMatches && (
              <p className="file-browser__message">
                Showing the first {returnedCount} of{" "}
                {search.results.totalMatches} matches. Add another word to
                narrow it down.
              </p>
            )}

            {!isLoading && (
              <>
                <FolderList
                  folders={visibleFolders}
                  showLocation={isFolderSearch}
                  kind={filters.kind}
                  selectedKey={selectedFile?.key ?? null}
                  onSelectFile={setSelectedFile}
                />
                <FileList
                  files={visibleFiles}
                  selectedKey={selectedFile?.key ?? null}
                  onSelectFile={setSelectedFile}
                  showLocation={isSearching}
                />
                {!isSearching && browse.nextCursor && (
                  <button
                    type="button"
                    className="file-browser__load-more"
                    onClick={() => void browse.loadMore()}
                  >
                    Load more
                  </button>
                )}
              </>
            )}
          </main>

          {selectedFile && (
            <FilePreviewPanel
              file={selectedFile}
              onClose={() => setSelectedFile(null)}
              onShowInFolder={openFolder}
            />
          )}
          <UploadTray uploads={uploads} onClearFinished={clearFinished} />
          {namingHelpFor && (
            <NamingConventionModal
              fileName={namingHelpFor}
              onClose={closeNamingHelp}
            />
          )}
        </div>
      </UploadsContext.Provider>
    </ViewModeContext.Provider>
  );
}
