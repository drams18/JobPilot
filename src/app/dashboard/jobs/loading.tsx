export default function JobsLoading() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 w-40 bg-gray-200 rounded-lg" />
        <div className="h-4 w-24 bg-gray-100 rounded-lg" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 flex-1 bg-white rounded-xl border border-gray-100" />
        <div className="h-9 w-32 bg-white rounded-xl border border-gray-100" />
        <div className="h-9 w-32 bg-white rounded-xl border border-gray-100" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 h-44" />
        ))}
      </div>
    </div>
  );
}
