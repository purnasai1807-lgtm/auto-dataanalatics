import { Activity, Boxes, DollarSign, ShoppingCart } from "lucide-react";
import { formatCurrency, formatNumber } from "../../utils/format";
const KPI_META = [
  { key: "total_sales", label: "Total Sales", icon: DollarSign, currency: true },
  { key: "orders", label: "Orders", icon: ShoppingCart },
  { key: "avg_order_value", label: "Avg Order Value", icon: Activity, currency: true },
  { key: "quantity", label: "Quantity", icon: Boxes },
];
interface KpiGridProps {
  kpis?: Record<string, number | string | null>;
}
function KpiGrid({ kpis = {} }: KpiGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPI_META.map(({ key, label, icon: Icon, currency }) => (
        <div key={key} className="glass-panel rounded-[24px] p-5 shadow-panel">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <div className="rounded-2xl bg-white/80 p-3 text-slate-900 dark:bg-white/10 dark:text-white">
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <div className="metric-value">
            {currency ? formatCurrency(Number(kpis[key] ?? 0)) : formatNumber(Number(kpis[key] ?? 0))}
          </div>
        </div>
      ))}
    </div>
  );
}
export default KpiGrid;
