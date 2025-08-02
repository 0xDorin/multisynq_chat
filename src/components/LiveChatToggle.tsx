// LiveChatToggle.tsx – 최종본 (store 직접 호출, 추가 훅 없음)
// -----------------------------------------------------------------------------
// • 세션은 패널 열릴 때만 acquire
// • 패널 닫아도 세션 유지 (view.detach) – 빠른 재오픈
// • 컴포넌트 unmount / 페이지 unload에만 release
// • 연결 실패 → Retry 버튼 / 자동 재시도
// -----------------------------------------------------------------------------
'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { type MultisynqSession } from '@multisynq/client'
import { ChatModel } from '@/lib/ChatModel'
import { ChatViewComponent } from './ChatView'
import { useChatSessionStore } from '@/store/use-chat-session-store'

interface LiveChatToggleProps {
  roomId: string
  position?: 'bottom-right' | 'bottom-left'
  nickname?: string
}

export function LiveChatToggle({ roomId, position = 'bottom-right', nickname }: LiveChatToggleProps) {
  /* ── State */
  const [isVisible, setIsVisible] = useState(false)
  const [session, setSession] = useState<MultisynqSession<any> | null>(null)
  const [model, setModel] = useState<ChatModel | null>(null)
  const [error, setError]   = useState<string | null>(null)
  const [retryKey, bumpRetry] = useState(0)

  const sessionRef = useRef<MultisynqSession<any> | null>(null)
  const chatRef    = useRef<HTMLDivElement>(null)

  /* ── Store funcs */
  const acquire = useChatSessionStore((s) => s.acquire)
  const release = useChatSessionStore((s) => s.release)
  const connStat = useChatSessionStore((s) => s.connectionStatus[roomId] ?? 'idle')
  const isConnecting = connStat === 'connecting' || connStat === 'reconnecting'

  /* ── Helpers */
  const clearSession = useCallback(() => {
    if (sessionRef.current) {
      release(roomId)
      sessionRef.current = null
    }
    setSession(null)
    setModel(null)
  }, [release, roomId])

  /**
   * Establish a new session or reuse an existing one.
   * Publishes nickname on the freshly acquired session object (`s`).
   */
  const connect = useCallback(async () => {
    try {
      const s = await acquire(roomId)
      sessionRef.current = s
      setSession(s)
      setModel(s.view.wellKnownModel('modelRoot') as ChatModel)
      setError(null)

      // Publish nickname immediately on the session we just got
      if (nickname) {
        s.view.publish('viewInfo', 'setNickname', {
          viewId: s.view.viewId,
          nickname,
        })
      }
    } catch (e) {
      setError((e as Error).message ?? 'unknown error')
    }
  }, [roomId, nickname])

  /* ── Publish nickname when session or nickname changes */
  useEffect(() => {
    if (!session || !nickname) return
    session.view.publish('viewInfo', 'setNickname', {
      viewId: session.view.viewId,
      nickname,
    })
  }, [session, nickname])

  /* ── Connect only when visible */

  useEffect(() => {
    if (!isVisible) return

    // 첫 오픈 또는 실패 상태만 재연결
    if (!sessionRef.current || connStat === 'failed') connect()
  }, [isVisible, retryKey])

  /* ── Detach view when hidden */
  useEffect(() => {
    if (!isVisible && sessionRef.current) {
      sessionRef.current.view.detach()
    }
  }, [isVisible])

  /* ── Cleanup on unmount / unload */
  useEffect(() => {
    window.addEventListener('beforeunload', clearSession)
    return () => {
      window.removeEventListener('beforeunload', clearSession)
      clearSession()
    }
  }, [clearSession])

  /* ── Auto‑scroll on open */
  useEffect(() => {
    if (isVisible && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [isVisible])

  /* ── UI helpers */
  const toggleVisible = () => setIsVisible((v) => !v)
  const retryConnect = () => {
    setError(null)
    bumpRetry((k) => k + 1)
  }

  const positionCls = useMemo(() => ({
    'bottom-right': 'bottom-4 right-4',
    'bottom-left':  'bottom-4 left-4',
  }), [])

  const connMsg = () => {
    switch (connStat) {
      case 'connecting':   return 'Connecting…'
      case 'reconnecting': return 'Reconnecting…'
      case 'connected':    return 'Connected'
      case 'failed':       return 'Connection failed'
      default:             return 'Connecting…'
    }
  }

  /* ── Render */
  return (
    <>
      {/* Toggle button */}
      <button
        onClick={toggleVisible}
        className={`fixed ${positionCls[position]} z-50 w-14 h-14 bg-[#a259ff] hover:bg-[#b084fa] text-white rounded-full shadow-lg flex items-center justify-center transition`}
        aria-label={isVisible ? 'Close chat' : 'Open chat'}
      >
        {isVisible ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        )}
      </button>

      {/* Chat window */}
      <div
        ref={chatRef}
        className={`fixed ${positionCls[position]} z-40 w-[500px] h-[700px] bg-[#181828] rounded-lg shadow-2xl mb-20 mr-2 transition-transform duration-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {error ? (
          <div className="flex items-center justify-center h-full p-4 text-center">
            <div>
              <p className="mb-2 text-red-400">Connection Error</p>
              <p className="mb-4 text-sm text-gray-400">{error}</p>
              <button
                onClick={retryConnect}
                className="px-4 py-2 text-white transition-colors rounded bg-[#a259ff] hover:bg-[#b084fa]"
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting…' : 'Retry'}
              </button>
            </div>
          </div>
        ) : !session || !model || isConnecting || !session?.view?.viewId ? (
          <div className="flex items-center justify-center h-full p-4 text-center">
            <div>
              <div className="mx-auto mb-2 border-b-2 rounded-full animate-spin h-8 w-8 border-[#a259ff]" />
              <p className="text-gray-300">{connMsg()}</p>
              {connStat === 'reconnecting' && <p className="mt-1 text-sm text-gray-500">Please wait…</p>}
            </div>
          </div>
        ) : (
          <div className="h-full overflow-hidden rounded-lg"><ChatViewComponent model={model} session={session} /></div>
        )}
      </div>
    </>
  )
}
