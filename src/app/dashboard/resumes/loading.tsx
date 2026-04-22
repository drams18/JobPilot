export default function ResumesLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-6 w-24 bg-gray-200 rounded-lg" />
      <div className="bg-white rounded-2xl border border-gray-100 h-28" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28" />
        ))}
      </div>
    </div>
  );
}
