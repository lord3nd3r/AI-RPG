'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Send, MoreVertical, Phone, Video, Search, User as UserIcon, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Friend {
  id: string
  name: string | null
  email: string | null
}

interface Participant {
  id: string
  name: string | null
  email: string | null
  lastSeen: string
}

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  read: boolean
}

interface Conversation {
  id: string
  participants: Participant[]
  lastMessage: {
    content: string
    senderId: string
    createdAt: string
    read: boolean
  } | null
  updatedAt: string
}

export default function MessengerClient({ userId }: { userId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const targetUserId = searchParams.get('userId')

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [friends, setFriends] = useState<Friend[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Fetch Conversations List
  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Failed to fetch conversations', error)
    }
  }

  const openNewChat = async () => {
      setShowNewChat(true)
      try {
          const res = await fetch('/api/friends')
          if (res.ok) {
              const data = await res.json()
              // API returns array of friends with { id, name, email } structure compatible
              setFriends(data)
          }
      } catch (e) { console.error(e) }
  }
  
  const startChat = async (friendId: string) => {
      setShowNewChat(false)
      const existing = conversations.find(c => c.participants.some(p => p.id === friendId))
      if (existing) {
          setActiveConversationId(existing.id)
      } else {
        try {
            const res = await fetch('/api/conversations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ targetUserId: friendId })
            })
            if (res.ok) {
              const { id } = await res.json()
              setActiveConversationId(id)
              fetchConversations()
            }
        } catch (e) {
          console.error(e)
        }
      }
  }

  // 2. Initial Load & Auto-create if targetUserId present
  useEffect(() => {
    const init = async () => {
      await fetchConversations()
      
      if (targetUserId) {
        // Try to find existing conversation with this user
        // Note: The conversations I fetched have a listing of participants. 
        // I need to find the one where one of the participants.id === targetUserId
        // Since my conversation fetch logic filters out 'me', participants array usually has just 1 person for 1-on-1.
        
        // Wait for state update is tricky in useEffect, so I'll re-fetch or assume the fetch above finished? 
        // Actually fetchConversations is async, so awaiting it works.
        // BUT setConversations is async in React terms. 
        // So I'll fetch again locally or use the response data directly if I refactor.
        
        // Better: create conversation API handles "return existing if exists".
        try {
            const res = await fetch('/api/conversations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ targetUserId })
            })
            if (res.ok) {
              const { id } = await res.json()
              setActiveConversationId(id)
              // Refresh list to ensure it appears
              fetchConversations()
              // Remove query param to clean URL
              router.replace('/messages')
            }
        } catch (e) {
          console.error(e)
        }
      }
    }
    init()
    
    // Poll conversation list for updates (last message preview)
    const interval = setInterval(fetchConversations, 10000)
    return () => clearInterval(interval)
  }, [targetUserId, router])

  // 3. Poll Active Conversation Messages
  useEffect(() => {
    if (!activeConversationId) return

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/conversations/${activeConversationId}/messages`)
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages)
        }
      } catch (error) {
        console.error(error)
      }
    }

    const init = async () => {
        setLoadingMessages(true)
        await fetchMessages()
        setLoadingMessages(false)
    }
    init()

    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [activeConversationId])

  // 4. Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !activeConversationId) return

    const tempId = 'temp-' + Date.now()
    const optimisticMsg: Message = {
      id: tempId,
      content: inputText,
      senderId: userId,
      createdAt: new Date().toISOString(),
      read: false
    }
    
    setMessages(prev => [...prev, optimisticMsg])
    setInputText('')

    try {
      const res = await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: optimisticMsg.content })
      })

      if (res.ok) {
        const realMsg = await res.json()
        setMessages(prev => prev.map(m => m.id === tempId ? realMsg : m))
        fetchConversations() // Update sidebar preview
      }
    } catch (error) {
      console.error('Send failed', error)
      // Remove optimistic message on fail
      setMessages(prev => prev.filter(m => m.id !== tempId))
    }
  }

  const activeConv = conversations.find(c => c.id === activeConversationId)
  const activeFriend = activeConv?.participants[0]

  return (
    <div className="flex h-full bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-900/50">
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-100">Messages</h2>
              <button onClick={openNewChat} className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white transition-colors shadow-lg shadow-indigo-500/20" title="New Message">
                  <Plus className="w-4 h-4" />
              </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 placeholder:text-slate-600"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => {
            const friend = conv.participants[0]
            const isUnread = conv.lastMessage && !conv.lastMessage.read && conv.lastMessage.senderId !== userId
            
            return (
              <button
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={cn(
                  "w-full p-4 flex items-center gap-3 hover:bg-slate-800/50 transition-colors text-left",
                  activeConversationId === conv.id ? "bg-slate-800/80 border-l-2 border-indigo-500" : "border-l-2 border-transparent"
                )}
              >
                <div className="relative shrink-0">
                   <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold border border-indigo-500/30">
                     {friend?.name?.[0] || friend?.email?.[0] || '?'}
                   </div>
                   {/* Online status indicator if needed later */}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-medium text-slate-200 truncate">{friend?.name || friend?.email || 'Unknown'}</span>
                    <span className="text-xs text-slate-500 shrink-0">
                       {conv.lastMessage ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                    </span>
                  </div>
                  <p className={cn("text-sm truncate", isUnread ? "text-white font-medium" : "text-slate-500")}>
                    {conv.lastMessage?.senderId === userId ? 'You: ' : ''}
                    {conv.lastMessage?.content || 'New conversation'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-950/30 relative">
        {activeConversationId ? (
          <>
            {/* Header */}
            <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 font-bold border border-purple-500/30">
                   {activeFriend?.name?.[0] || '?'}
                 </div>
                 <div>
                   <h3 className="font-bold text-slate-100">{activeFriend?.name || activeFriend?.email}</h3>
                   <div className="text-xs text-green-400 flex items-center gap-1">
                     <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                     Online
                   </div>
                 </div>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <button className="hover:text-white transition-colors"><Phone className="h-5 w-5" /></button>
                <button className="hover:text-white transition-colors"><Video className="h-5 w-5" /></button>
                <button className="hover:text-white transition-colors"><MoreVertical className="h-5 w-5" /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex justify-center pt-20 text-slate-500">
                  Loading scrolls...
                </div>
              ) : (
                <>
                   {messages.map((msg, idx) => {
                     const isMe = msg.senderId === userId
                     const showAvatar = !isMe && (idx === 0 || messages[idx-1].senderId !== msg.senderId)
                     
                     return (
                       <div key={msg.id} className={cn("flex gap-3", isMe ? "justify-end" : "justify-start")}>
                         {!isMe && (
                           <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs shrink-0 mt-1 opacity-80">
                             {showAvatar ? (activeFriend?.name?.[0] || '?') : ''}
                           </div>
                         )}
                         <div className={cn("max-w-[70%] group relative")}>
                            <div className={cn(
                              "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                              isMe 
                                ? "bg-indigo-600 text-white rounded-br-none" 
                                : "bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700"
                            )}>
                              {msg.content}
                            </div>
                            <div className={cn(
                              "text-[10px] text-slate-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-full",
                              isMe ? "right-0" : "left-0"
                            )}>
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </div>
                         </div>
                       </div>
                     )
                   })}
                   <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-900/80 border-t border-slate-800 sticky bottom-0 backdrop-blur-md">
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative flex items-center gap-4">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-full px-6 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner"
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/25"
                >
                  <Send className="h-4 w-4 ml-0.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
             <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center mb-6">
                <UserIcon className="h-10 w-10 opacity-20" />
             </div>
             <p className="text-lg font-medium">Select a conversation</p>
             <p className="text-sm">or start a new one from your friends list</p>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-white">New Message</h3>
                    <button onClick={() => setShowNewChat(false)} className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto flex-1 space-y-2">
                    {friends.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <p>No friends found.</p>
                            <p className="text-sm mt-1">Add friends from the lobby or search to start chatting!</p>
                        </div>
                    ) : (
                        friends.map(friend => (
                            <button 
                                key={friend.id}
                                onClick={() => startChat(friend.id)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl transition-colors text-left group"
                            >
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold border border-indigo-500/30 group-hover:bg-indigo-500/30 group-hover:border-indigo-500/50 transition-all">
                                    {friend.name?.[0] || friend.email?.[0] || '?'}
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-200 group-hover:text-white transition-colors">{friend.name || friend.email}</h4>
                                    <p className="text-xs text-slate-500">{friend.email}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
