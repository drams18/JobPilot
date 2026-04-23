export default function Loading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-8 w-64 bg-gray-200 rounded-lg" />
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 h-96 bg-white rounded-2xl border border-gray-200" />
        <div className="h-96 bg-white rounded-2xl border border-gray-200" />
      </div>
    </div>
  );
}
