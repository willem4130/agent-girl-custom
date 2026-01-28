
const SearchIcon = () => (
  <svg
    className="size-4"
    aria-hidden="true"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
  >
    <path
      d="M20.25 20.25L16.1265 16.1265M16.1265 16.1265C17.4385 14.8145 18.25 13.002 18.25 11C18.25 6.99594 15.0041 3.75 11 3.75C6.99594 3.75 3.75 6.99594 3.75 11C3.75 15.0041 6.99594 18.25 11 18.25C13.002 18.25 14.8145 17.4385 16.1265 16.1265Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const GeneratedIcon = () => (
  <svg
    aria-hidden="true"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    className="size-4"
  >
    <path
      d="M11.1306 2.3204C11.6704 2.01673 12.3296 2.01673 12.8694 2.3204L20.1194 6.39853C20.17 6.42695 20.2188 6.45764 20.2657 6.49042L12.0006 11.1396L3.73465 6.49018C3.78148 6.45749 3.83015 6.42688 3.88055 6.39853L11.1306 2.3204Z"
      fill="currentColor"
    />
    <path
      d="M2.98338 7.78861C2.97886 7.84007 2.97656 7.89197 2.97656 7.94421V16.0558C2.97656 16.6965 3.32214 17.2873 3.88055 17.6015L11.1306 21.6796C11.17 21.7017 11.21 21.7223 11.2506 21.7412V12.4388L2.98338 7.78861Z"
      fill="currentColor"
    />
    <path
      d="M12.7506 21.7407C12.7908 21.7219 12.8304 21.7015 12.8694 21.6796L20.1194 17.6015C20.6779 17.2873 21.0234 16.6965 21.0234 16.0558V7.94421C21.0234 7.89212 21.0212 7.84035 21.0167 7.78903L12.7506 12.4388V21.7407Z"
      fill="currentColor"
    />
  </svg>
);

const UploadIcon = () => (
  <svg
    aria-hidden="true"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    className="size-4"
  >
    <path
      d="M12 16V3M12 3L7 8M12 3L17 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 15V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export type AssetTab = "generated" | "uploaded";

interface AssetsSidebarProps {
  activeTab: AssetTab;
  onTabChange: (tab: AssetTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  generatedCount?: number;
  uploadedCount?: number;
}

export default function AssetsSidebar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  generatedCount = 0,
  uploadedCount = 0,
}: AssetsSidebarProps) {
  return (
    <section className="grid grid-rows-[auto_1fr] min-h-0 w-48 shrink-0 pl-4 pt-4">
      {/* Search Header */}
      <header className="pr-4 mb-4">
        <form
          className="grid grid-cols-[1fr_auto] p-1 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10"
          onSubmit={(e) => e.preventDefault()}
        >
          <label className="h-6 gap-1.5 grid grid-cols-[auto_1fr] items-center text-zinc-400 focus-within:text-white transition">
            <span className="h-full aspect-square grid justify-center items-center">
              <SearchIcon />
            </span>
            <input
              autoComplete="off"
              placeholder="Search"
              className="w-full bg-transparent text-xs font-medium placeholder:text-zinc-400 text-white outline-none"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              name="search"
            />
          </label>
        </form>
      </header>

      {/* Tabs */}
      <div className="pr-4 overflow-y-auto space-y-1 pb-20 rounded-lg min-h-0">
        {/* Generated Assets Tab */}
        <button
          type="button"
          data-active={activeTab === "generated"}
          onClick={() => onTabChange("generated")}
          className="grid grid-cols-[auto_1fr_auto] items-center w-full text-left pl-2 pr-1 py-1 h-8 rounded-lg gap-2 transition-colors text-zinc-400 hover:text-white data-[active=true]:text-white data-[active=true]:bg-white/10"
        >
          <span className="size-4 grid justify-center items-center">
            <GeneratedIcon />
          </span>
          <p className="w-full truncate text-xs">Generated</p>
          {generatedCount > 0 && (
            <span className="bg-white/10 py-0.5 px-1.5 rounded-md text-[10px] font-semibold">
              {generatedCount}
            </span>
          )}
        </button>

        {/* Uploaded Tab */}
        <button
          type="button"
          data-active={activeTab === "uploaded"}
          onClick={() => onTabChange("uploaded")}
          className="grid grid-cols-[auto_1fr_auto] items-center w-full text-left pl-2 pr-1 py-1 h-8 rounded-lg gap-2 transition-colors text-zinc-400 hover:text-white data-[active=true]:text-white data-[active=true]:bg-white/10"
        >
          <span className="size-4 grid justify-center items-center">
            <UploadIcon />
          </span>
          <p className="w-full truncate text-xs">Uploaded</p>
          {uploadedCount > 0 && (
            <span className="bg-white/10 py-0.5 px-1.5 rounded-md text-[10px] font-semibold">
              {uploadedCount}
            </span>
          )}
        </button>
      </div>
    </section>
  );
}
