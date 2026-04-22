export default function SettingsLoading() {
  return (
    <div className="max-w-xl flex flex-col gap-6 animate-pulse">
      <div className="h-6 w-36 bg-gray-200 rounded-lg" />
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="h-4 w-32 bg-gray-100 rounded" />
            <div className="h-9 bg-gray-50 rounded-lg border border-gray-100" />
          </div>
        ))}
        <div className="h-10 bg-gray-100 rounded-xl mt-2" />
      </div>
    </div>
  );
}
