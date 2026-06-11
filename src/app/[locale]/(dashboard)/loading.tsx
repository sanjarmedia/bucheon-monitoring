export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-secondary rounded-lg" />
        <div className="h-4 w-96 bg-secondary/60 rounded-lg" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 bg-card border rounded-xl p-4 space-y-3">
            <div className="h-4 w-24 bg-secondary rounded" />
            <div className="h-7 w-16 bg-secondary rounded" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 bg-card border rounded-xl" />
        <div className="h-72 bg-card border rounded-xl" />
      </div>
    </div>
  )
}
