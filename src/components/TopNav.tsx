import { useEffect, useRef, useState } from 'react'

type Props = {
  title: string
  username?: string
  realname?: string
  onLogout?: () => void
  onTitleClick?: () => void
}

function getAvatarChar(realname?: string, username?: string) {
  const source = (realname || username || '').trim()
  if (!source) return ''
  const chars = Array.from(source)
  return chars[chars.length - 1]
}

export default function TopNav({
  title,
  username,
  realname,
  onLogout,
  onTitleClick,
}: Props) {
  const avatarChar = getAvatarChar(realname, username)
  const [menuOpen, setMenuOpen] = useState(false)
  const hideTimerRef = useRef<number | null>(null)

  function clearHideTimer() {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  function handleAreaEnter() {
    clearHideTimer()
    setMenuOpen(true)
  }

  function handleAreaLeave() {
    clearHideTimer()
    hideTimerRef.current = window.setTimeout(() => {
      setMenuOpen(false)
      hideTimerRef.current = null
    }, 100)
  }

  useEffect(() => {
    return () => {
      clearHideTimer()
    }
  }, [])

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <div className="top-nav-left">
          <div
            className="top-nav-title"
            onClick={onTitleClick}
            style={onTitleClick ? { cursor: 'pointer' } : undefined}
          >
            {title}
          </div>
        </div>
        <div className="top-nav-right">
          {username && (
            <div
              className={
                'top-nav-user' + (menuOpen ? ' top-nav-user-open' : '')
              }
              onMouseEnter={handleAreaEnter}
              onMouseLeave={handleAreaLeave}
            >
              <span className="top-nav-username">{username}</span>
              {avatarChar && <div className="top-nav-avatar">{avatarChar}</div>}
              {onLogout && (
                <div className="top-nav-avatar-menu">
                  <button
                    type="button"
                    className="top-nav-avatar-menu-item"
                    onClick={onLogout}
                  >
                    退出登录
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
