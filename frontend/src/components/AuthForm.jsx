import { useState } from 'react'
import { useNavigate } from 'react-router'
import api from '../lib/api.js'
import FormField from './FormField.jsx'

function AuthForm({ mode }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    emailAddress: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isRegister = mode === 'register'

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFeedback(null)

    if (isRegister && form.password !== form.confirmPassword) {
      setFeedback({ type: 'error', message: 'Those passwords don’t match. Please try again.' })
      return
    }

    if (new TextEncoder().encode(form.password).length > 72) {
      setFeedback({ type: 'error', message: 'Please choose a shorter password.' })
      return
    }

    setIsSubmitting(true)

    try {
      if (isRegister) {
        const account = {
          firstName: form.firstName.trim(),
          emailAddress: form.emailAddress.trim().toLowerCase(),
        }

        await api.post('/auth/register', {
          firstName: form.firstName,
          lastName: form.lastName,
          fullName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
          username: form.username,
          emailAddress: form.emailAddress,
          password: form.password,
        })

        sessionStorage.setItem('registeredAccount', JSON.stringify(account))
        navigate('/waitlist', { state: account })
      } else {
        const response = await api.post('/auth/login', {
          emailAddress: form.emailAddress,
          password: form.password,
        })

        if (response.data.token) {
          sessionStorage.setItem('token', response.data.token)
        }
        const account = { emailAddress: form.emailAddress.trim().toLowerCase() }
        sessionStorage.setItem('registeredAccount', JSON.stringify(account))
        navigate('/waitlist', { state: account })
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'We couldn’t connect. Please try again in a moment.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="mb-8">
        <p className="mb-3 text-sm font-semibold tracking-wide text-violet-600">
          {isRegister ? 'GET STARTED' : 'WELCOME BACK'}
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.1rem] dark:text-white">
          {isRegister ? 'Create your account' : 'Sign in to your account'}
        </h2>
        <p className="mt-2 text-[15px] leading-6 text-slate-500 dark:text-slate-400">
          {isRegister
            ? 'A few details and you’ll be on your way.'
            : 'Enter your details below to pick up where you left off.'}
        </p>
      </div>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            feedback.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        {isRegister && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="First name"
                id="firstName"
                autoComplete="given-name"
                placeholder="Jane"
                value={form.firstName}
                onChange={updateField}
                required
              />
              <FormField
                label="Last name"
                id="lastName"
                autoComplete="family-name"
                placeholder="Doe"
                value={form.lastName}
                onChange={updateField}
                required
              />
            </div>
            <FormField
              label="Username"
              id="username"
              autoComplete="username"
              placeholder="janedoe"
              value={form.username}
              onChange={updateField}
              required
            />
          </>
        )}

        <FormField
          label="Email address"
          id="emailAddress"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.emailAddress}
          onChange={updateField}
          required
        />

        <div>
          <div className="relative">
            <FormField
              label="Password"
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              placeholder={isRegister ? 'Create a password' : 'Enter your password'}
              value={form.password}
              onChange={updateField}
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute right-3 top-[38px] z-10 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-violet-600 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'HIDE' : 'SHOW'}
            </button>
          </div>
          {isRegister && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Use at least 8 characters.</p>}
        </div>

        {isRegister ? (
          <FormField
            label="Confirm password"
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Enter your password again"
            value={form.confirmPassword}
            onChange={updateField}
            minLength={8}
            required
          />
        ) : (
          <div className="-mt-2 flex justify-end">
            <span className="text-xs text-slate-400 dark:text-slate-500">Forgot password? Contact support.</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
          {!isSubmitting && (
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path d="M4.5 10h11m0 0-4.5-4.5M15.5 10 11 14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
        {isRegister ? 'Already have an account?' : 'New here?'}{' '}
        <button
          type="button"
          onClick={() => navigate(isRegister ? '/login' : '/register')}
          className="font-semibold text-violet-700 hover:text-violet-900 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-violet-600 dark:text-violet-300 dark:hover:text-violet-200"
        >
          {isRegister ? 'Sign in' : 'Create an account'}
        </button>
      </p>
      <p className="mt-10 text-center text-xs leading-5 text-slate-400 dark:text-slate-500">
        Your details are used to create and access your account.
      </p>
    </>
  )
}

export default AuthForm
