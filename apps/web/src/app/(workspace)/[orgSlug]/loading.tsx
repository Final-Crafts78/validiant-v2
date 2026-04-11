export default function WorkspaceLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] space-y-4 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-surface-soft rounded-full absolute top-0 left-0"></div>
        <div className="w-16 h-16 border-4 border-primary-500 rounded-full border-t-transparent animate-spin relative z-10"></div>
      </div>
      <p className="text-sm font-medium text-text-muted animate-pulse tracking-wide">
        Loading workspace...
      </p>
    </div>
  );
}
