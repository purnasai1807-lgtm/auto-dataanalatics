import { ReactNode, useMemo, useRef } from "react";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";
import Plot from "react-plotly.js";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
const COLORS = ["#14b8a6", "#f97316", "#0f172a", "#38bdf8", "#facc15", "#8b5cf6"];
interface ChartsGridProps {
  charts?: Record<string, any>;
}
function ChartPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const exportPng = async () => {
    if (!ref.current) {
      return;
    }
    const dataUrl = await toPng(ref.current, { cacheBust: true, pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = dataUrl;
    link.click();
  };
  return (
    <div className="glass-panel rounded-[28px] p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="section-title">{title}</h3>
        <button
          onClick={exportPng}
          className="inline-flex items-center rounded-2xl border border-slate-300/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200"
        >
          <Download className="mr-2 h-3.5 w-3.5" />
          Export PNG
        </button>
      </div>
      <div ref={ref} className="h-[320px] rounded-[22px] bg-white/55 p-2 dark:bg-slate-950/30">
        {children}
      </div>
    </div>
  );
}
function ChartsGrid({ charts = {} }: ChartsGridProps) {
  const lineSeries = charts.time_series?.data ?? [];
  const barSeries = charts.category_bar?.data ?? [];
  const pieSeries = charts.status_pie?.data ?? [];
  const countrySeries = charts.country_bar?.data ?? [];
  const heatmap = charts.heatmap ?? { x: [], y: [], z: [] };
  const trendMessage = charts.trend?.message ?? "Trend analysis unavailable";
  const trendTone = charts.trend?.direction === "up" ? "text-teal-500" : "text-orange-500";
  const plotLayout = useMemo(
    () => ({
      autosize: true,
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      font: { color: "#64748b", family: "IBM Plex Sans, sans-serif" },
      margin: { l: 40, r: 10, t: 20, b: 40 },
    }),
    [],
  );
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartPanel title="Revenue Over Time">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={lineSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.25} />
            <XAxis dataKey="period" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>
      <ChartPanel title="Category Performance">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.25} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} angle={-20} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>
      <ChartPanel title="Status Split">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieSeries} dataKey="value" nameKey="label" innerRadius={65} outerRadius={105} paddingAngle={4}>
              {pieSeries.map((_: unknown, index: number) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartPanel>
      <ChartPanel title="Market Heatmap">
        <Plot
          data={[
            {
              type: "heatmap",
              z: heatmap.z,
              x: heatmap.x,
              y: heatmap.y,
              colorscale: [
                [0, "#0f172a"],
                [0.5, "#14b8a6"],
                [1, "#f97316"],
              ],
            },
          ]}
          layout={plotLayout}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: "100%", height: "100%" }}
        />
      </ChartPanel>
      <ChartPanel title="Top Markets">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={countrySeries} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.25} />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} width={100} />
            <Tooltip />
            <Bar dataKey="value" radius={[0, 10, 10, 0]} fill="#0f172a" />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>
      <div className="glass-panel rounded-[28px] p-5 shadow-panel">
        <h3 className="section-title">Trend Detection</h3>
        <div className="mt-6 rounded-[24px] bg-white/65 p-6 dark:bg-slate-950/30">
          <p className={`font-display text-3xl font-bold ${trendTone}`}>{charts.trend?.delta_pct ?? 0}%</p>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{trendMessage}</p>
        </div>
      </div>
    </div>
  );
}
export default ChartsGrid;
