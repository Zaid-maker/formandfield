import { useLocation, useNavigate } from 'react-router'
import BrandMark from '../components/BrandMark.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'

function getRegisteredAccount(locationState) {
  if (locationState?.emailAddress) {
    return locationState
  }

  try {
    return JSON.parse(sessionStorage.getItem('registeredAccount') || '{}')
  } catch {
    return {}
  }
}

function WaitlistPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const account = getRegisteredAccount(location.state)

  function previewDashboard() {
    sessionStorage.setItem('dashboardPreview', 'true')
    navigate('/dashboard-preview')
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#f7f7fb] px-4 py-20 transition-colors sm:px-8 dark:bg-[#0b0a12]">
      <div className="absolute right-5 top-5 z-10 sm:right-8 sm:top-8">
        <ThemeToggle />
      </div>
      <section className="w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_90px_-40px_rgba(35,24,76,0.28)] transition-colors dark:bg-[#15131f]">
        <div className="relative overflow-hidden bg-[#181329] px-7 py-12 text-white sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-48 -left-20 h-80 w-80 rounded-full bg-violet-600/25 blur-3xl" />
          <div className="relative">
            <BrandMark light />
            <div className="mt-16 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-200 ring-1 ring-violet-300/20">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-7 w-7">
                <path d="M5 12.5 9.5 17 19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="mt-8 text-sm font-semibold tracking-[0.16em] text-violet-300">YOU’RE ALL SET</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              You’re on the list{account.firstName ? `, ${account.firstName}` : ''}.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
              Your account is ready. We’re putting the finishing touches on your homepage, and this is where you’ll land when it’s ready.
            </p>
          </div>
        </div>
        <div className="px-7 py-8 sm:px-12 sm:py-10">
          {account.emailAddress && (
            <>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Account created with</p>
              <p className="mt-1 break-all text-sm text-slate-500 dark:text-slate-400">{account.emailAddress}</p>
            </>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={previewDashboard}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 sm:w-auto dark:border-white/10 dark:text-slate-200 dark:hover:border-violet-400/40 dark:hover:bg-violet-400/10 dark:hover:text-violet-200"
            >
              Preview dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 sm:w-auto"
            >
              Go to sign in
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path d="M4.5 10h11m0 0-4.5-4.5M15.5 10 11 14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default WaitlistPage
