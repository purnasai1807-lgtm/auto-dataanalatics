import { Fragment, ReactNode, useMemo, useRef } from "react";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";
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
type HeatmapMatrix = {
  x?: string[];
  y?: string[];
  z?: Array<Array<number | null>>;
};

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

function mixColor(from: [number, number, number], to: [number, number, number], ratio: number) {
  return from.map((value, index) => Math.round(value + (to[index] - value) * ratio)) as [
    number,
    number,
    number,
  ];
}

function colorForHeatmapValue(value: number, minValue: number, maxValue: number) {
  if (!Number.isFinite(value)) {
    return "rgba(148, 163, 184, 0.18)";
  }
  const safeMin = Number.isFinite(minValue) ? minValue : -1;
  const safeMax = Number.isFinite(maxValue) ? maxValue : 1;
  const denominator = safeMax - safeMin || 1;
  const normalized = Math.max(0, Math.min(1, (value - safeMin) / denominator));
  const paletteStops: Array<[number, number, number]> = [
    [15, 23, 42],
    [45, 212, 191],
    [249, 115, 22],
  ];
  const scaled = normalized * (paletteStops.length - 1);
  const index = Math.min(paletteStops.length - 2, Math.floor(scaled));
  const localRatio = scaled - index;
  const [red, green, blue] = mixColor(paletteStops[index], paletteStops[index + 1], localRatio);
  return `rgb(${red}, ${green}, ${blue})`;
}

function HeatmapGrid({ heatmap }: { heatmap: HeatmapMatrix }) {
  const xLabels = Array.isArray(heatmap.x) ? heatmap.x.map((value) => String(value)) : [];
  const yLabels = Array.isArray(heatmap.y) ? heatmap.y.map((value) => String(value)) : [];
  const zMatrix = Array.isArray(heatmap.z) ? heatmap.z : [];
  const flatValues = useMemo(
    () =>
      zMatrix
        .flat()
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value)),
    [zMatrix],
  );
  const minValue = flatValues.length ? Math.min(...flatValues) : -1;
  const maxValue = flatValues.length ? Math.max(...flatValues) : 1;

  if (!xLabels.length || !yLabels.length || !zMatrix.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Heatmap data is unavailable for this dataset.
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto rounded-[18px] bg-white/60 p-3 dark:bg-slate-950/20">
      <div
        className="grid min-w-max gap-2"
        style={{
          gridTemplateColumns: `minmax(110px, 1.2fr) repeat(${xLabels.length}, minmax(56px, 1fr))`,
        }}
      >
        <div className="sticky left-0 z-10 rounded-xl bg-white/95 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:bg-slate-950 dark:text-slate-400">
          Metric
        </div>
        {xLabels.map((label) => (
          <div
            key={`x-${label}`}
            className="rounded-xl bg-white/80 px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-950/70 dark:text-slate-400"
          >
            {label}
          </div>
        ))}
        {yLabels.map((rowLabel, rowIndex) => (
          <Fragment key={`row-${rowLabel}`}>
            <div className="sticky left-0 z-10 flex items-center rounded-xl bg-white/95 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-950 dark:text-slate-200">
              {rowLabel}
            </div>
            {xLabels.map((columnLabel, columnIndex) => {
              const rawValue = zMatrix[rowIndex]?.[columnIndex];
              const value = typeof rawValue === "number" ? rawValue : Number.NaN;
              const backgroundColor = colorForHeatmapValue(value, minValue, maxValue);
              return (
                <div
                  key={`${rowLabel}-${columnLabel}`}
                  title={`${rowLabel} vs ${columnLabel}: ${Number.isFinite(value) ? value.toFixed(2) : "N/A"}`}
                  className="flex min-h-[52px] items-center justify-center rounded-xl border border-white/40 text-sm font-semibold text-white shadow-sm"
                  style={{ backgroundColor }}
                >
                  {Number.isFinite(value) ? value.toFixed(2) : "--"}
                </div>
              );
            })}
          </Fragment>
        ))}
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
        <HeatmapGrid heatmap={heatmap} />
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
