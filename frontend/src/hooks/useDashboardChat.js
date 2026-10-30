import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

function mergeMessages(current = [], incoming = []) {
  const messagesById = new Map(current.map((message) => [message.id, message]))
  incoming.forEach((message) => messagesById.set(message.id, message))
  return [...messagesById.values()].sort((first, second) => first.id.localeCompare(second.id))
}

function shouldRetryQuery(failureCount, error) {
  return error.response?.status !== 401 && failureCount < 1
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback
}

function useDashboardChat({ isPreview }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [hasToken] = useState(() => Boolean(sessionStorage.getItem('token')))
  const [selectedChannelId, setSelectedChannelId] = useState(null)
  const [previewMessages, setPreviewMessages] = useState(demoMessages)
  const sendingRef = useRef(false)

  const workspaceQuery = useQuery({
    queryKey: ['dashboard', 'workspace'],
    queryFn: async () => {
      const { data } = await api.get('/api/dashboard')
      return data
    },
    enabled: isPreview && hasToken,
    retry: shouldRetryQuery,
  })

  const workspace = workspaceQuery.data
  const activeChannelId = workspace?.channels.some((channel) => channel.id === selectedChannelId)
    ? selectedChannelId
    : workspace?.channels[0]?.id ?? null

  const messagesQuery = useQuery({
    queryKey: ['dashboard', 'messages', activeChannelId],
    queryFn: async ({ queryKey }) => {
      const channelId = queryKey[2]
      const cachedMessages = queryClient.getQueryData(queryKey) ?? []
      const after = cachedMessages.at(-1)?.id
      const { data } = await api.get(
        `/api/dashboard/channels/${channelId}/messages`,
        { params: after ? { after } : {} }
      )
      const incomingMessages = data.messages.map((message) => mapMessage(message, workspace.user.id))
      return mergeMessages(queryClient.getQueryData(queryKey) ?? cachedMessages, incomingMessages)
    },
    enabled: isPreview && hasToken && Boolean(activeChannelId) && Boolean(workspace),
    refetchInterval: 5000,
    retry: shouldRetryQuery,
  })

  const sendMessageMutation = useMutation({
    mutationFn: async ({ channelId, content }) => {
      const { data } = await api.post(
        `/api/dashboard/channels/${channelId}/messages`,
        { content }
      )
      return data.message
    },
    onSuccess: (message, { channelId }) => {
      const queryKey = ['dashboard', 'messages', channelId]
      const mappedMessage = mapMessage(message, workspace.user.id)
      queryClient.setQueryData(queryKey, (current = []) => mergeMessages(current, [mappedMessage]))
    },
  })

  const requestError = sendMessageMutation.error || messagesQuery.error || workspaceQuery.error

  useEffect(() => {
    if (requestError?.response?.status === 401) {
      sessionStorage.removeItem('token')
      navigate('/login', { replace: true })
    }
  }, [navigate, requestError])

  async function sendMessage(channelId, content) {
    if (!hasToken) {
      setPreviewMessages((current) => [
        ...current,
        {
          id: `demo-${Date.now()}`,
          name: 'You',
          initials: 'Y',
          color: 'bg-violet-600',
          time: 'Just now',
          text: content,
        },
      ])
      return true
    }

    if (sendingRef.current) return false
    sendingRef.current = true
    sendMessageMutation.reset()
    try {
      await sendMessageMutation.mutateAsync({ channelId, content })
      return true
    } catch {
      return false
    } finally {
      sendingRef.current = false
    }
  }

  return {
    activeChannelId,
    channels: workspace?.channels ?? null,
    error: requestError
      ? getErrorMessage(requestError, 'Something went wrong. Please try again.')
      : '',
    hasToken,
    isLoading: workspaceQuery.isLoading || messagesQuery.isLoading,
    isSending: sendMessageMutation.isPending,
    messages: hasToken ? messagesQuery.data ?? [] : previewMessages,
    sendMessage,
    server: workspace?.server ?? null,
    setActiveChannelId: setSelectedChannelId,
    user: workspace?.user ?? null,
  }
}

export default useDashboardChat
