export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28" />
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 h-56" />
    </div>
  );
}
