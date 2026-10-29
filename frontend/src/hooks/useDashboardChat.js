import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import api from '../lib/api.js'

const demoMessages = [
  {
    id: 'demo-maya',
    name: 'Maya Chen',
    initials: 'MC',
    color: 'bg-rose-400',
    time: 'Today at 9:41 AM',
    text: 'Morning everyone! What is one small thing you are looking forward to this week?',
  },
  {
    id: 'demo-jordan',
    name: 'Jordan Lee',
    initials: 'JL',
    color: 'bg-sky-500',
    time: 'Today at 9:46 AM',
    text: 'Getting outside for a long walk. The weather is finally starting to feel like spring.',
  },
  {
    id: 'demo-you',
    name: 'You',
    initials: 'Y',
    color: 'bg-violet-600',
    time: 'Today at 9:52 AM',
    text: 'I am excited to get this space up and running. Happy to be here!',
  },
]

function mapMessage(message, currentUserId) {
  const authorName = message.author.username ||
    `${message.author.firstName} ${message.author.lastName}`.trim()

  return {
    id: message.id,
    name: message.author.id === currentUserId ? 'You' : authorName,
    initials: message.author.id === currentUserId
      ? 'Y'
      : authorName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
    color: message.author.id === currentUserId ? 'bg-violet-600' : 'bg-sky-500',
    time: new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    text: message.content,
  }
}

function appendUniqueMessages(current, incoming) {
  const existingIds = new Set(current.map((message) => message.id))
  return [...current, ...incoming.filter((message) => !existingIds.has(message.id))]
}

function useDashboardChat({ isPreview }) {
  const navigate = useNavigate()
  const [hasToken] = useState(() => Boolean(sessionStorage.getItem('token')))
  const [workspace, setWorkspace] = useState(null)
  const [activeChannelId, setActiveChannelId] = useState(null)
  const [messagesByChannel, setMessagesByChannel] = useState(() => hasToken ? {} : { demo: demoMessages })
  const [isLoading, setIsLoading] = useState(hasToken && isPreview)
  const [error, setError] = useState('')
  const cursorRef = useRef('')

  useEffect(() => {
    if (!isPreview || !hasToken) {
      return undefined
    }
    let active = true
    api.get('/api/dashboard')
      .then(({ data }) => {
        if (!active) return
        setWorkspace(data)
        setActiveChannelId(data.channels[0]?.id ?? null)
      })
      .catch((requestError) => {
        if (!active) return
        if (requestError.response?.status === 401) {
          sessionStorage.removeItem('token')
          navigate('/login', { replace: true })
          return
        }
        setError(requestError.response?.data?.message || 'Could not load your workspace. Please try again.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [hasToken, isPreview, navigate])

  useEffect(() => {
    if (!hasToken || !activeChannelId) {
      return undefined
    }

    let active = true
    let isFetching = false
    cursorRef.current = ''

    async function fetchMessages(initial = false) {
      if (isFetching) return
      isFetching = true
      try {
        const params = !initial && cursorRef.current ? { after: cursorRef.current } : {}
        const { data } = await api.get(
          `/api/dashboard/channels/${activeChannelId}/messages`,
          { params }
        )
        if (!active) return

        const newMessages = data.messages.map((message) => mapMessage(message, workspace.user.id))
        if (initial) {
          setMessagesByChannel((current) => ({ ...current, [activeChannelId]: newMessages }))
        } else if (newMessages.length) {
          setMessagesByChannel((current) => ({
            ...current,
            [activeChannelId]: appendUniqueMessages(current[activeChannelId] ?? [], newMessages),
          }))
        }
        if (data.messages.length) {
          const nextCursor = data.messages[data.messages.length - 1].id
          if (nextCursor > cursorRef.current) cursorRef.current = nextCursor
        }
      } catch (requestError) {
        if (!active) return
        if (requestError.response?.status === 401) {
          sessionStorage.removeItem('token')
          navigate('/login', { replace: true })
          return
        }
        setError(requestError.response?.data?.message || 'Could not load messages. Please try again.')
      } finally {
        isFetching = false
      }
    }

    fetchMessages(true)
    const intervalId = window.setInterval(() => fetchMessages(false), 5000)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [activeChannelId, hasToken, navigate, workspace])

  async function sendMessage(channelId, content) {
    if (!hasToken) {
      setMessagesByChannel((current) => ({
        ...current,
        demo: [
          ...(current.demo ?? []),
          {
            id: `demo-${Date.now()}`,
            name: 'You',
            initials: 'Y',
            color: 'bg-violet-600',
            time: 'Just now',
            text: content,
          },
        ],
      }))
      return true
    }

    setError('')
    try {
      const { data } = await api.post(
        `/api/dashboard/channels/${channelId}/messages`,
        { content }
      )
      const message = mapMessage(data.message, workspace.user.id)
      setMessagesByChannel((current) => ({
        ...current,
        [channelId]: appendUniqueMessages(current[channelId] ?? [], [message]),
      }))
      if (data.message.id > cursorRef.current) cursorRef.current = data.message.id
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        sessionStorage.removeItem('token')
        navigate('/login', { replace: true })
        return false
      }
      setError(requestError.response?.data?.message || 'Could not send your message. Please try again.')
      return false
    }
    return true
  }

  return {
    channels: workspace?.channels ?? null,
    error,
    hasToken,
    isLoading,
    messages: hasToken
      ? messagesByChannel[activeChannelId] ?? []
      : messagesByChannel.demo ?? [],
    sendMessage,
    server: workspace?.server ?? null,
    setActiveChannelId,
    user: workspace?.user ?? null,
    activeChannelId,
  }
}

export default useDashboardChat
