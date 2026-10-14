import { useEffect } from "react";

interface NamingConventionModalProps {
  fileName: string; // the name that was refused
  onClose: () => void;
}

const example = "MAC_SC01_001_WIP_V001.mp4";

// One row per part of the name, in order.
const cheatSheet = [
  {
    part: "Sequence",
    example: "MAC",
    meaning: "The sequence code, in letters.",
  },
  {
    part: "Shot",
    example: "SC01",
    meaning: '"SC" followed by the shot number.',
  },
  { part: "Number", example: "001", meaning: "Three digits." },
  {
    part: "Stage",
    example: "WIP",
    meaning: "The stage of work, such as WIP or FINAL.",
  },
  {
    part: "Version",
    example: "V001",
    meaning: '"V" followed by the version number.',
  },
];

export function NamingConventionModal({
  fileName,
  onClose,
}: NamingConventionModalProps) {
  // Escape closes it, like any dialog.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="naming-modal-title"
        onClick={(event) => event.stopPropagation()} // clicks inside don't close it
      >
        <h2 id="naming-modal-title">That file name can't be uploaded</h2>
        <p>
          <strong>{fileName}</strong> doesn't follow the naming convention.
          Rename the file and try again.
        </p>
        <p className="modal__example">
          Example: <code>{example}</code>
        </p>

        <table className="cheat-sheet">
          <thead>
            <tr>
              <th>Part</th>
              <th>Example</th>
              <th>What it is</th>
            </tr>
          </thead>
          <tbody>
            {cheatSheet.map((row) => (
              <tr key={row.part}>
                <td>{row.part}</td>
                <td>
                  <code>{row.example}</code>
                </td>
                <td>{row.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="modal__note">
          Join the parts with underscores. The file extension (.mp4, .png, …)
          stays as it is.
        </p>
        <button type="button" className="modal__close" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}
