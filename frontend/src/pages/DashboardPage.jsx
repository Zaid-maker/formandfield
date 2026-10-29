import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import ThemeToggle from '../components/ThemeToggle.jsx'
import useDashboardChat from '../hooks/useDashboardChat.js'

const demoServers = [
  { id: 'field-notes', label: 'Field Notes', short: 'FN', color: 'bg-violet-600' },
  { id: 'garden-club', label: 'Garden Club', short: 'GC', color: 'bg-emerald-600' },
  { id: 'studio', label: 'Studio', short: 'S', color: 'bg-amber-500' },
]

const demoChannels = [
  { category: 'YOUR SPACE', items: ['general', 'introductions', 'ideas'] },
  { category: 'HANGOUT', items: ['off-topic', 'show-and-tell'] },
]

function DashboardWorkspace({ isPreview }) {
  const navigate = useNavigate()
  const {
    activeChannelId,
    channels: workspaceChannels,
    error,
    hasToken,
    isLoading,
    messages,
    sendMessage: postMessage,
    server,
    setActiveChannelId,
    user,
  } = useDashboardChat({ isPreview })
  const [demoActiveServer, setDemoActiveServer] = useState(demoServers[0])
  const [demoActiveChannel, setDemoActiveChannel] = useState('general')
  const [draft, setDraft] = useState('')

  const servers = hasToken
    ? server
      ? [{ id: server.id, label: server.name, short: server.name.slice(0, 2).toUpperCase(), color: 'bg-violet-600' }]
      : []
    : demoServers
  const activeServer = hasToken ? servers[0] : demoActiveServer
  const activeChannel = hasToken
    ? workspaceChannels?.find((channel) => channel.id === activeChannelId)?.name ?? 'general'
    : demoActiveChannel
  const channelGroups = hasToken
    ? [{ category: 'TEXT CHANNELS', items: workspaceChannels ?? [] }]
    : demoChannels.map((group) => ({
        ...group,
        items: group.items.map((name) => ({ id: name, name })),
      }))

  async function sendMessage(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || (hasToken && !activeChannelId)) return

    if (await postMessage(activeChannelId, text)) {
      setDraft('')
    }
  }

  return (
    <main className="flex h-screen min-h-[560px] overflow-hidden bg-slate-100 text-slate-900 dark:bg-[#1e1f22] dark:text-slate-100">
      <nav aria-label="Servers" className="flex w-[72px] shrink-0 flex-col items-center gap-3 bg-slate-200 py-4 dark:bg-[#1e1f22]">
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-7 w-7">
            <path d="M12 3.5 20.5 8v8L12 20.5 3.5 16V8L12 3.5Z" stroke="currentColor" strokeWidth="1.7" />
            <path d="m8.5 12 2.2 2.2 4.8-4.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="h-px w-8 bg-slate-400/40 dark:bg-white/10" />
        {servers.map((server) => (
          <button
            key={server.id}
            type="button"
            title={server.label}
            aria-label={`${server.label} server`}
            aria-pressed={activeServer?.id === server.id}
            onClick={() => {
              if (!hasToken) setDemoActiveServer(server)
            }}
            className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold text-white transition ${
              activeServer?.id === server.id
                ? `${server.color} rounded-xl`
                : `${server.color} hover:rounded-xl`
            }`}
          >
            {activeServer?.id === server.id && (
              <span className="absolute -left-[13px] h-8 w-1 rounded-r-full bg-slate-900 dark:bg-white" />
            )}
            {server.short}
          </button>
        ))}
        {!hasToken && (
          <button
            type="button"
            aria-label="Add a server"
            title="Add a server"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl text-emerald-600 shadow-sm transition hover:rounded-xl hover:bg-emerald-600 hover:text-white dark:bg-[#313338] dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white"
          >
            +
          </button>
        )}
        <div className="mt-auto">
          <ThemeToggle />
        </div>
      </nav>

      <aside className="flex w-60 shrink-0 flex-col bg-slate-50 dark:bg-[#2b2d31]">
        <button
          type="button"
          className="flex h-14 items-center justify-between border-b border-slate-200 px-4 text-left font-bold shadow-sm dark:border-black/20"
          aria-label={`${activeServer?.label ?? (hasToken ? 'Your workspace' : 'Field Notes')} server menu`}
        >
          <span className="truncate">{activeServer?.label ?? 'Field Notes'}</span>
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-slate-500">
            <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex-1 overflow-y-auto px-2 py-4">
          {channelGroups.map((group) => (
            <div key={group.category} className="mb-6">
              <p className="mb-2 px-2 text-[10px] font-bold tracking-[0.14em] text-slate-500 dark:text-slate-400">
                {group.category}
              </p>
              <div className="space-y-1">
                {group.items.map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    aria-current={activeChannel === channel.name ? 'page' : undefined}
                    onClick={() => {
                      if (hasToken) setActiveChannelId(channel.id)
                      else setDemoActiveChannel(channel.name)
                    }}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition ${
                      activeChannel === channel.name
                        ? 'bg-slate-200 font-semibold text-slate-900 dark:bg-[#404249] dark:text-white'
                        : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-[#35373c] dark:hover:text-slate-100'
                    }`}
                  >
                    <span className="text-lg leading-none text-slate-400">#</span>
                    <span className="truncate">{channel.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!hasToken && (
            <>
              <div className="mb-2 flex items-center justify-between px-2 text-[10px] font-bold tracking-[0.14em] text-slate-500 dark:text-slate-400">
                <span>VOICE ROOMS</span>
                <button type="button" aria-label="Add a voice room" className="text-base leading-none hover:text-slate-900 dark:hover:text-white">+</button>
              </div>
              <div className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-500 dark:text-slate-400">
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <path d="M7.5 4.5a2.5 2.5 0 0 1 5 0v5a2.5 2.5 0 0 1-5 0v-5ZM5 9.5a5 5 0 0 0 10 0M10 14.5v3m-3 0h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>Quiet corner</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-100 px-3 py-3 dark:border-black/20 dark:bg-[#232428]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">Y</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{user?.username ?? 'Your account'}</p>
            <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{hasToken ? 'Online' : 'On the waitlist'}</p>
          </div>
          <button type="button" aria-label="User settings" className="rounded p-1 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-white/10">
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" strokeWidth="1.5" /><path d="m16 11.5 1 .8-1.5 2.6-1.2-.5a6.6 6.6 0 0 1-1.3.8l-.2 1.3h-3l-.2-1.3a6.6 6.6 0 0 1-1.3-.8l-1.2.5-1.5-2.6 1-.8a6 6 0 0 1 0-1.5l-1-.8 1.5-2.6 1.2.5a6.6 6.6 0 0 1 1.3-.8l.2-1.3h3l.2 1.3a6.6 6.6 0 0 1 1.3.8l1.2-.5L17 9.2l-1 .8a6 6 0 0 1 0 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-white dark:bg-[#313338]">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 px-4 shadow-sm dark:border-black/20">
          <span className="text-xl text-slate-400">#</span>
          <h1 className="font-semibold">{activeChannel}</h1>
          <span className="hidden h-5 w-px bg-slate-300 dark:bg-white/10 sm:block" />
          <p className="hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block">
            A good place to start a conversation.
          </p>
          {isPreview && (
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('dashboardPreview')
                navigate('/waitlist')
              }}
              className="ml-auto rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 dark:border-violet-400/20 dark:text-violet-200 dark:hover:bg-violet-400/10"
            >
              Exit preview
            </button>
          )}
          <div className="ml-auto flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <button type="button" aria-label="Search messages" className="rounded p-1 hover:bg-slate-100 dark:hover:bg-white/10">
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
                <circle cx="8.8" cy="8.8" r="5.3" stroke="currentColor" strokeWidth="1.5" /><path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <span className="text-xs">{hasToken ? '1 here' : '12 here'}</span>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            {error && (
              <p role="alert" className="mx-4 mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200 sm:mx-6">
                {error}
              </p>
            )}
            <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6">
              <div className="mb-8 mt-auto border-b border-slate-200 pb-5 dark:border-white/10">
                <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-3xl text-slate-500 dark:bg-[#404249] dark:text-slate-300">#</div>
                <h2 className="text-2xl font-bold">Welcome to #{activeChannel}!</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">This is the beginning of the #{activeChannel} channel.</p>
              </div>
              {isLoading ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading your workspace…</p>
              ) : messages.map((message) => (
                <article key={message.id} className="group flex gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${message.color}`}>
                    {message.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <h3 className="text-sm font-semibold">{message.name}</h3>
                      <time className="text-[10px] text-slate-400">{message.time}</time>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-slate-300">{message.text}</p>
                  </div>
                </article>
              ))}
            </div>
            <form onSubmit={sendMessage} className="px-4 pb-5 sm:px-6">
              <label htmlFor="chat-message" className="sr-only">Message #{activeChannel}</label>
              <div className="flex items-center gap-3 rounded-xl bg-slate-100 px-4 py-2 dark:bg-[#383a40]">
                <button type="button" aria-label="Add an attachment" className="text-2xl leading-none text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">+</button>
                <input
                  id="chat-message"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={hasToken && !activeChannelId ? 'Loading channels…' : `Message #${activeChannel}`}
                  disabled={hasToken && !activeChannelId}
                  className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
                />
                <button type="submit" aria-label="Send message" disabled={!draft.trim()} className="rounded-lg p-2 text-violet-600 transition hover:bg-violet-100 disabled:opacity-40 dark:text-violet-300 dark:hover:bg-white/10">
                  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
                    <path d="m3 9 13-6-4.5 14-2.2-5.3L3 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="m9.3 11.7 3.2-3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          <aside aria-label="Online members" className="hidden w-56 shrink-0 border-l border-slate-200 bg-slate-50 p-4 xl:block dark:border-black/20 dark:bg-[#2b2d31]">
            <h2 className="mb-4 text-[10px] font-bold tracking-[0.14em] text-slate-500 dark:text-slate-400">
              {hasToken ? 'MEMBERS — 1' : 'ONLINE — 3'}
            </h2>
            {(hasToken
              ? user ? [['Y', user.username || `${user.firstName} ${user.lastName}`, 'bg-violet-600']] : []
              : [
                  ['MC', 'Maya Chen', 'bg-rose-400'],
                  ['JL', 'Jordan Lee', 'bg-sky-500'],
                  ['AR', 'Alex Rivera', 'bg-amber-500'],
                ]).map(([initials, name, color]) => (
              <div key={name} className="mb-3 flex items-center gap-2 rounded-md px-2 py-1.5">
                <div className={`relative flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white ${color}`}>
                  {initials}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-50 bg-emerald-500 dark:border-[#2b2d31]" />
                </div>
                <span className="truncate text-xs font-medium text-slate-600 dark:text-slate-300">{name}</span>
              </div>
            ))}
          </aside>
        </div>
      </section>
    </main>
  )
}

function DashboardPage({ gated = false, preview = false }) {
  if (gated) {
    return <Navigate to="/waitlist" replace />
  }

  if (preview && sessionStorage.getItem('dashboardPreview') !== 'true') {
    return <Navigate to="/waitlist" replace />
  }

  return <DashboardWorkspace isPreview={preview} />
}

export default DashboardPage
