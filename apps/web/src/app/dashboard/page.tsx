import { Card } from "@life-id/ui"

const stats = [
  { label: "المرضى", value: "—" },
  { label: "الأطباء", value: "—" },
  { label: "الحجوزات", value: "—" },
  { label: "الإيرادات", value: "—" }
]

export default function Dashboard() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-2xl font-extrabold">لوحة التحكم (Super Admin)</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <div className="text-sm text-slate-500">{s.label}</div>
            <div className="mt-1 font-display text-3xl font-extrabold">{s.value}</div>
          </Card>
        ))}
      </div>
    </main>
  )
}
