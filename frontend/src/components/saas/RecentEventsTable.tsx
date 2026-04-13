import type { TrackingEventItem } from "../../api/types";
import { formatDate } from "../../utils/format";

interface RecentEventsTableProps {
  events: TrackingEventItem[];
}

function RecentEventsTable({ events }: RecentEventsTableProps) {
  return (
    <section className="glass-panel rounded-[30px] p-5 shadow-panel">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
            Live Feed
          </p>
          <h3 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Recent events
          </h3>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">Near real-time polling</div>
      </div>
      <div className="mt-5 overflow-x-auto rounded-[24px] bg-white/65 p-3 dark:bg-slate-950/30">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              <th className="px-3 py-3">Event</th>
              <th className="px-3 py-3">Path</th>
              <th className="px-3 py-3">Device</th>
              <th className="px-3 py-3">Referrer</th>
              <th className="px-3 py-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Events will appear here as soon as the tracking script starts receiving traffic.
                </td>
              </tr>
            ) : null}
            {events.map((event) => (
              <tr key={event.id} className="border-t border-slate-200/80 dark:border-slate-700">
                <td className="px-3 py-4">
                  <div className="font-semibold text-slate-900 dark:text-white">{event.event_name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{event.event_type}</div>
                </td>
                <td className="px-3 py-4 text-slate-600 dark:text-slate-300">{event.path}</td>
                <td className="px-3 py-4 text-slate-600 dark:text-slate-300">
                  {event.device_type} / {event.browser}
                </td>
                <td className="px-3 py-4 text-slate-600 dark:text-slate-300">{event.referrer_host ?? "Direct"}</td>
                <td className="px-3 py-4 text-slate-600 dark:text-slate-300">{formatDate(event.occurred_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default RecentEventsTable;
