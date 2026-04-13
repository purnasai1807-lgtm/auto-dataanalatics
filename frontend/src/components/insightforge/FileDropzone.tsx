import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

export function FileDropzone({
  loading,
  onUpload
}: {
  loading: boolean;
  onUpload: (file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) {
      return;
    }
    await onUpload(file);
  }

  return (
    <section className="premium-panel rounded-[30px] p-5 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Upload</p>
          <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950">Drop a CSV or XLSX file</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Generate an executive summary, smart charts, and a shareable PDF report in seconds.
          </p>
        </div>
        <div className="hidden h-14 w-14 items-center justify-center rounded-[20px] bg-slate-950 text-white sm:flex">
          <UploadCloud className="h-6 w-6" />
        </div>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={`mt-5 flex w-full flex-col items-center justify-center rounded-[28px] border border-dashed px-5 py-12 text-center transition ${
          dragging
            ? "border-teal-500 bg-teal-500/10"
            : "border-slate-300/80 bg-white/60 hover:border-slate-400"
        }`}
      >
        <UploadCloud className="h-9 w-9 text-slate-700" />
        <div className="mt-4 font-display text-2xl font-semibold text-slate-950">
          {loading ? "Analyzing dataset..." : "Drag and drop your data"}
        </div>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Free accounts can generate 3 reports per day. Pro accounts get unlimited analysis, export, and report history.
        </p>
        <span className="mt-5 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
          Choose file
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx"
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </section>
  );
}
