import { CheckCircle2, CircleDashed, Crown, FileDown, UploadCloud } from "lucide-react";

export function SetupChecklist({
  hasAnyReport,
  hasUploadedReport,
  hasExportedPdf,
  onboardingCompleted,
  isPro
}: {
  hasAnyReport: boolean;
  hasUploadedReport: boolean;
  hasExportedPdf: boolean;
  onboardingCompleted: boolean;
  isPro: boolean;
}) {
  const items = [
    {
      title: "Run your first analysis",
      detail: "Use the sample dataset or upload a client file to generate insight output.",
      complete: hasAnyReport,
      icon: UploadCloud
    },
    {
      title: "Upload a real dataset",
      detail: "Demonstrate the paid workflow with a real CSV or XLSX file.",
      complete: hasUploadedReport,
      icon: UploadCloud
    },
    {
      title: "Export a PDF report",
      detail: "Show the delivery artifact a buyer or client actually receives.",
      complete: hasExportedPdf,
      icon: FileDown
    },
    {
      title: "Unlock monetization mode",
      detail: "Pro removes daily limits and completes the revenue story.",
      complete: isPro,
      icon: Crown
    }
  ];

  return (
    <section className="premium-panel rounded-[30px] p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Launch checklist</p>
      <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950">
        Product activation
      </h3>
      <div className="mt-5 space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="rounded-[24px] border border-slate-200/80 bg-white/70 p-4">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-[16px] ${item.complete ? "bg-teal-600 text-white" : "bg-slate-950 text-white"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-950">{item.title}</h4>
                    {item.complete ? (
                      <CheckCircle2 className="h-4 w-4 text-teal-700" />
                    ) : (
                      <CircleDashed className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <div className="mt-5 rounded-[22px] bg-slate-950 px-4 py-3 text-sm text-slate-200">
        Onboarding status: <span className="font-semibold text-white">{onboardingCompleted ? "Complete" : "In progress"}</span>
      </div>
    </section>
  );
}
