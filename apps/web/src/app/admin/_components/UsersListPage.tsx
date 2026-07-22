import type { Role } from "@life-id/types"
import { listUsersByRole } from "../../../lib/adminUsers"
import PageHeader from "./PageHeader"
import SearchBox from "./SearchBox"
import UsersTable from "./UsersTable"

export default async function UsersListPage({
  title,
  roles,
  query,
  basePath,
}: {
  title: string
  roles: Role[]
  query?: string
  basePath: string
}) {
  const rows = await listUsersByRole(roles, query)
  return (
    <div className="space-y-4">
      <PageHeader title={title} count={rows.length} />
      <SearchBox placeholder={"ابحث في " + title + "..."} />
      <UsersTable rows={rows} basePath={basePath} />
    </div>
  )
}
