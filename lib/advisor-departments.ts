/** Rows from advisor_department_affiliations (additional departments only). */
export type AdvisorDeptAffiliation = { advisor_id: string; dept_id: string }

export function buildExtraDeptNamesByAdvisor(
  affiliations: AdvisorDeptAffiliation[],
  deptIdToName: Map<string, string>
): Map<string, string[]> {
  const m = new Map<string, string[]>()
  for (const row of affiliations) {
    const name = deptIdToName.get(row.dept_id)
    if (!name) continue
    const list = m.get(row.advisor_id) ?? []
    list.push(name)
    m.set(row.advisor_id, list)
  }
  const out = new Map<string, string[]>()
  for (const [id, names] of Array.from(m.entries())) {
    out.set(id, Array.from(new Set(names)).sort((a, b) => a.localeCompare(b)))
  }
  return out
}

/** One line for search + list cards: primary + additional, deduped, stable order. */
export function formatAdvisorDepartmentLine(primaryName: string | null | undefined, extraNames: string[] | undefined): string {
  const parts: string[] = []
  if (primaryName) parts.push(primaryName)
  for (const n of extraNames ?? []) {
    if (n && !parts.includes(n)) parts.push(n)
  }
  return parts.join(' · ')
}
