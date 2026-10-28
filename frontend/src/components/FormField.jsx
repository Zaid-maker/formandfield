function FormField({ label, id, type = 'text', ...props }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#100e18] dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/20"
        {...props}
      />
    </label>
  )
}

export default FormField
