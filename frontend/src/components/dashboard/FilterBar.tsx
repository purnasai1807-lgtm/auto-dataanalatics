interface FilterBarProps {
  filterOptions?: Record<string, any>;
  filters: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}
function FilterBar({ filterOptions = {}, filters, onChange }: FilterBarProps) {
  return (
    <section className="glass-panel rounded-[28px] p-5 shadow-panel">
      <div className="mb-4">
        <h2 className="section-title">Dashboard Filters</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Narrow the dashboard by time, geography, category, or product line.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <input
          type="date"
          value={filters.date_from ?? ""}
          onChange={(event) => onChange({ ...filters, date_from: event.target.value })}
          className="rounded-2xl border border-slate-300/70 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950/40"
        />
        <input
          type="date"
          value={filters.date_to ?? ""}
          onChange={(event) => onChange({ ...filters, date_to: event.target.value })}
          className="rounded-2xl border border-slate-300/70 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950/40"
        />
        {["country", "category", "product_line"].map((field) => (
          <select
            key={field}
            value={filters[field] ?? ""}
            onChange={(event) => onChange({ ...filters, [field]: event.target.value })}
            className="rounded-2xl border border-slate-300/70 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950/40"
          >
            <option value="">{field.replace("_", " ")}</option>
            {(filterOptions[field] ?? []).map((value: string) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        ))}
      </div>
    </section>
  );
}
export default FilterBar;
