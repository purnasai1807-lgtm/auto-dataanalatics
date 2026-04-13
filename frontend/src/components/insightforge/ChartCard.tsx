import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ChartSeries } from "../../lib/insightforgeApi";

const palette = ["#0f766e", "#1d4ed8", "#f97316", "#dc2626", "#7c3aed", "#14b8a6"];

export function ChartCard({ series }: { series: ChartSeries }) {
  const chart =
    series.type === "line" ? (
      <LineChart data={series.data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={28} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
      </LineChart>
    ) : series.type === "bar" ? (
      <BarChart data={series.data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip />
        <Bar dataKey="value" fill="#0f766e" radius={[12, 12, 0, 0]} />
      </BarChart>
    ) : (
      <PieChart>
        <Pie data={series.data} dataKey="value" nameKey="label" innerRadius={64} outerRadius={98} paddingAngle={3}>
          {series.data.map((item, index) => (
            <Cell key={item.label} fill={palette[index % palette.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    );

  return (
    <section className="premium-panel rounded-[30px] p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Visualization</p>
      <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950">{series.label}</h3>
      <div className="mt-5 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          {chart}
        </ResponsiveContainer>
      </div>
    </section>
  );
}
