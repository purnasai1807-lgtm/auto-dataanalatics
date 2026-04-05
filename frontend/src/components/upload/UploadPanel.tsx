import { ChangeEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileUp, LoaderCircle } from "lucide-react";
interface UploadPanelProps {
  uploading: boolean;
  progress: number;
  onUpload: (file: File, name: string) => Promise<void>;
}
function UploadPanel({ uploading, progress, onUpload }: UploadPanelProps) {
  const [datasetName, setDatasetName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file && !datasetName) {
      setDatasetName(file.name.replace(/\.[^.]+$/, ""));
    }
  };
  const submit = async () => {
    if (!selectedFile) {
      return;
    }
    await onUpload(selectedFile, datasetName || selectedFile.name);
    setSelectedFile(null);
    setDatasetName("");
  };
  return (
    <section className="glass-panel rounded-[28px] p-5 shadow-panel">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="section-title">Smart Upload</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            CSV, Excel, and JSON with chunked uploads and background processing for large files.
          </p>
        </div>
      </div>
      <div className="rounded-[24px] border border-dashed border-slate-300/80 bg-white/70 p-6 dark:border-slate-700 dark:bg-slate-950/30">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 text-center">
          <div className="rounded-2xl bg-accent-500/10 p-4 text-accent-600 dark:bg-accent-500/20 dark:text-accent-500">
            <FileUp className="h-8 w-8" />
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">
              Drop a dataset here or click to browse
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Supports large uploads with progress tracking and async processing.
            </p>
          </div>
          <input className="hidden" type="file" accept=".csv,.xlsx,.xls,.json" onChange={handleFileSelect} />
        </label>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr,auto]">
        <input
          value={datasetName}
          onChange={(event) => setDatasetName(event.target.value)}
          placeholder="Dataset name"
          className="rounded-2xl border border-slate-300/70 bg-white/80 px-4 py-3 text-sm outline-none ring-0 transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950/40"
        />
        <button
          onClick={submit}
          disabled={!selectedFile || uploading}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
        >
          {uploading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
          {uploading ? "Uploading..." : "Upload & Analyze"}
        </button>
      </div>
      <AnimatePresence>
        {selectedFile ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-4 rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-950/30"
          >
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
              <span>{selectedFile.name}</span>
              <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-mint-500 to-accent-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
export default UploadPanel;
