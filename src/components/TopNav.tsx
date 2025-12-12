type Props = {
  title: string
  username?: string
  realname?: string
  onLogout?: () => void
}

function getAvatarChar(realname?: string, username?: string) {
  const source = (realname || username || '').trim()
  if (!source) return ''
  const chars = Array.from(source)
  return chars[chars.length - 1]
}

export default function TopNav({ title, username, realname, onLogout }: Props) {
  const avatarChar = getAvatarChar(realname, username)

  return (
    <header className="top-nav">
      <div className="top-nav-left">
        <div className="top-nav-title">{title}</div>
      </div>
      <div className="top-nav-right">
        {username && (
          <div className="top-nav-user">
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
    </header>
  )
}
