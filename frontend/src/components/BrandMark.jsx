function BrandMark({ light = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-950/20">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
          <path d="M12 3.5 20.5 8v8L12 20.5 3.5 16V8L12 3.5Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="m8.5 12 2.2 2.2 4.8-4.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span className={`text-lg font-bold tracking-tight ${light ? 'text-white' : 'text-slate-950 dark:text-white'}`}>
        Form &amp; Field
      </span>
    </div>
  )
}

export default BrandMark
