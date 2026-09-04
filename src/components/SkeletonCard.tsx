export function SkeletonCard() {
  return (
    <div className="w-[168px] shrink-0 rounded-xl bg-elevated/60 p-3 sm:w-[180px]">
      <div className="skeleton mb-3 aspect-square w-full rounded-lg" />
      <div className="skeleton mb-2 h-3.5 w-4/5 rounded" />
      <div className="skeleton h-3 w-3/5 rounded" />
    </div>
  )
}
