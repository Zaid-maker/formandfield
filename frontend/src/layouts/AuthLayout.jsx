import { Outlet } from 'react-router'
import BrandMark from '../components/BrandMark.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'

function AuthLayout() {
  return (
    <main className="min-h-screen bg-[#f7f7fb] px-4 py-6 transition-colors sm:px-8 sm:py-10 dark:bg-[#0b0a12]">
      <div className="mx-auto grid min-h-[min(820px,calc(100vh-3rem))] max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_90px_-40px_rgba(35,24,76,0.28)] transition-colors lg:grid-cols-[0.94fr_1.06fr] dark:bg-[#15131f]">
        <aside className="relative hidden overflow-hidden bg-[#181329] px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -right-36 -top-32 h-[28rem] w-[28rem] rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-20 -top-16 h-[22rem] w-[22rem] rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-48 -left-40 h-[32rem] w-[32rem] rounded-full bg-violet-600/25 blur-3xl" />

          <div className="relative">
            <BrandMark light />
          </div>

          <div className="relative max-w-md pb-8">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-2 text-xs font-medium text-violet-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              A calmer way to get started
            </div>
            <h1 className="text-5xl font-semibold leading-[1.12] tracking-[-0.04em]">
              Make room for
              <span className="block text-violet-300">what’s next.</span>
            </h1>
            <p className="mt-6 max-w-sm text-base leading-7 text-slate-300">
              Create your account and keep all the things you care about moving forward.
            </p>
            <div className="mt-12 flex items-center gap-3">
              <div className="flex -space-x-2">
                {['A', 'M', 'J'].map((initial, index) => (
                  <div
                    key={initial}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#181329] text-xs font-semibold ${['bg-rose-300 text-rose-950', 'bg-amber-200 text-amber-950', 'bg-sky-300 text-sky-950'][index]}`}
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <span className="text-sm text-slate-300">A little space to do your best work.</span>
            </div>
          </div>

          <p className="relative text-xs text-slate-500">Simple beginnings. Good things ahead.</p>
        </aside>

        <section className="relative flex items-center justify-center bg-white px-5 py-16 transition-colors sm:px-12 sm:py-16 lg:px-16 dark:bg-[#15131f]">
          <div className="absolute right-5 top-5 z-10 sm:right-8 sm:top-8">
            <ThemeToggle />
          </div>
          <div className="w-full max-w-[430px]">
            <div className="mb-10 lg:hidden">
              <BrandMark />
            </div>
            <Outlet />
          </div>
        </section>
      </div>
    </main>
  )
}

export default AuthLayout
