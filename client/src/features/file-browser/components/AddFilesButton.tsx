import { useRef } from "react";

interface AddFilesButtonProps {
  label: string; // e.g. "Add files to Props"
  onFilesChosen: (files: File[]) => void;
}

export function AddFilesButton({ label, onFilesChosen }: AddFilesButtonProps) {
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        type="button"
        className="add-files-button"
        title={label}
        aria-label={label}
        onClick={() => fileInput.current?.click()}
      >
        + Add
      </button>
      <input
        ref={fileInput}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          onFilesChosen(Array.from(event.target.files ?? []));
          event.target.value = ""; // lets the same file be chosen again later
        }}
      />
    </>
  );
}
