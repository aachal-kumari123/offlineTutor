const TeacherCardSkeleton = () => (
  <div className="card overflow-hidden animate-pulse" aria-label="Loading teacher">
    <div className="h-40 bg-slate-200 dark:bg-slate-700" />
    <div className="space-y-3 p-5">
      <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="flex gap-2"><div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-700" /><div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-700" /></div>
      <div className="h-10 w-full rounded bg-slate-200 dark:bg-slate-700" />
      <div className="flex justify-between border-t border-slate-100 pt-4 dark:border-slate-700"><div className="h-5 w-20 rounded bg-slate-200 dark:bg-slate-700" /><div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700" /></div>
    </div>
  </div>
);

export default TeacherCardSkeleton;
