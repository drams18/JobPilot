export default function ApplicationsLoading() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      <div className="h-6 w-44 bg-gray-200 rounded-lg" />
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="h-10 bg-gray-50 border-b border-gray-100" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 border-b border-gray-50 px-4 flex items-center gap-4">
            <div className="h-4 w-40 bg-gray-100 rounded" />
            <div className="h-4 w-28 bg-gray-100 rounded" />
            <div className="h-5 w-20 bg-gray-100 rounded-full ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
