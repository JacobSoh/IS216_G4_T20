'use client'

import Image from 'next/image'
import { Input } from '@/components/ui/input'

export default function ChatModal({
  isOpen,
  onClose,
  chatMessages,
  chatParticipantCount,
  isChatFetching,
  currentUserId,
  ownerId,
  chatInput,
  setChatInput,
  handleChatSubmit,
  isSendingChat,
  chatFeedback,
  formatChatTimestamp,
  resolveAvatarUrl,
  chatMessagesEndRef
}) {
  if (!isOpen) return null

  return (
    <div className="absolute bottom-20 right-4 md:bottom-24 md:right-6 w-[calc(100vw-2rem)] max-w-sm md:w-96 h-80 md:h-96 text-white z-[200]">
      <div className="bg-black/90 rounded-xl border border-[var(--theme-secondary)]/50 backdrop-blur-sm shadow-[0_0_40px_rgba(176,38,255,0.5)] h-full flex flex-col">
        {/* Chat Header */}
        <div className="p-3 md:p-4 border-b border-[var(--theme-secondary)]/30 flex justify-between items-center">
          <div>
            <h3 className="text-base md:text-lg font-bold text-[var(--theme-secondary)]">
              Live Chat
            </h3>
            <p className="text-xs text-purple-300">
              {chatParticipantCount} messages • {isChatFetching ? 'Updating…' : 'Live'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white text-xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2">
          {chatMessages.length === 0 && (
            <p className="text-xs text-purple-300 italic text-center">No messages yet. Start the conversation!</p>
          )}
          {chatMessages.map((chat) => {
            const isOwn = currentUserId && chat.uid === currentUserId
            const isOwnerMessage = ownerId ? chat.uid === ownerId : false
            const avatarUrl = resolveAvatarUrl(chat.sender)
            return (
              <div
                key={chat.chat_id ?? `${chat.sent_at}-${chat.uid}`}
                className={`flex items-end gap-1.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className="flex-shrink-0">
                  <Image
                    src={avatarUrl}
                    alt={chat.sender?.username ?? 'Guest avatar'}
                    className="h-7 w-7 rounded-full object-cover border border-[var(--theme-secondary)]/40"
                    width={28}
                    height={28}
                  />
                </div>
                <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-3 py-2 shadow-sm ${
                      isOwn
                        ? 'bg-[var(--theme-secondary)] text-white rounded-br-md'
                        : 'bg-[var(--theme-primary)] text-white border border-[var(--theme-secondary)]/30 rounded-bl-md'
                    }`}
                  >
                    <p className="text-[10px] font-semibold mb-0.5 opacity-90 flex items-center gap-1.5">
                      <span>{chat.sender?.username ?? 'Guest'}</span>
                      {isOwnerMessage && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] uppercase tracking-wider" style={{ backgroundColor: 'var(--theme-cream)', color: 'var(--theme-primary)' }}>
                          Owner
                        </span>
                      )}
                    </p>
                    <p className="text-sm break-words leading-relaxed">
                      {chat.message}
                    </p>
                  </div>
                  <span className={`text-[9px] text-purple-300 mt-0.5 px-2 ${isOwn ? 'text-right' : 'text-left'}`}>
                    {formatChatTimestamp(chat.sent_at)}
                  </span>
                </div>
              </div>
            )
          })}
          <div ref={chatMessagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-3 md:p-4 border-t border-[var(--theme-secondary)]/30">
          <form className="flex gap-2 w-full" onSubmit={handleChatSubmit}>
            <div className="flex-1 min-w-0">
              <Input
                type="text"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Type a message..."
                className="w-full"
              />
            </div>
            <button
              type="submit"
              disabled={isSendingChat || !chatInput.trim()}
              className="px-3 md:px-4 py-2 bg-[var(--theme-secondary)] hover:bg-[var(--theme-primary)] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all text-xs md:text-sm shadow-[0_0_15px_rgba(176,38,255,0.4)] flex-shrink-0"
            >
              {isSendingChat ? 'Sending…' : 'Send'}
            </button>
          </form>
          {chatFeedback && (
            <p className="mt-2 text-[11px] md:text-xs text-[var(--theme-secondary)]">{chatFeedback}</p>
          )}
        </div>
      </div>
    </div>
  )
}
