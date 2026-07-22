import { Plus } from "lucide-react"

export default function PageHeader({
  title,
  count,
}: {
  title: string
  count: number
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{count} عنصر</p>
      </div>
      <button className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
        <Plus className="h-4 w-4" /> إضافة
      </button>
    </div>
  )
}
