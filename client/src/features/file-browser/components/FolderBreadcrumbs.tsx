interface FolderBreadcrumbsProps {
  folder: string;
  onNavigate: (path: string) => void;
}

export function FolderBreadcrumbs({
  folder,
  onNavigate,
}: FolderBreadcrumbsProps) {
  const segments = folder.split("/").filter(Boolean);

  return (
    <nav className="breadcrumbs">
      <button type="button" onClick={() => onNavigate("")}>
        All files
      </button>
      {segments.map((segment, index) => {
        const path = `${segments.slice(0, index + 1).join("/")}/`;
        return (
          <span key={path}>
            <span className="breadcrumbs__divider">/</span>
            <button type="button" onClick={() => onNavigate(path)}>
              {segment}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
