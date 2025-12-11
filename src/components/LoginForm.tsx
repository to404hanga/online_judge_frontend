import { useState } from 'react'
import { login } from '../api/auth'

// 登录表单组件
// - 管理用户名/密码的受控输入
// - 处理登录请求与状态提示（loading、错误、成功）
// - 登录成功时，向父组件回调下发的 token（如果后端提供）
type Props = {
  onLoginSuccess?: (token: string | null) => void // 登录成功回调，传出 JWT token（可能为 null）
}

export default function LoginForm({ onLoginSuccess }: Props) {
  // 用户名输入值（受控组件）
  const [username, setUsername] = useState('')
  // 密码输入值（受控组件）
  const [password, setPassword] = useState('')
  // 加载中状态：用于禁用按钮与展示“登录中…”
  const [loading, setLoading] = useState(false)
  // 错误提示文案：当校验失败或请求失败时展示
  const [error, setError] = useState('')
  // 成功提示文案：当登录成功时展示
  const [message, setMessage] = useState('')

  // 表单提交：阻止默认刷新，做前端校验，再调用登录接口
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault() // 阻止浏览器默认提交行为
    setError('')       // 清空历史错误
    setMessage('')     // 清空历史成功提示

    // 简单必填校验
    if (!username || !password) {
      setError('请输入用户名与密码')
      return
    }

    setLoading(true) // 进入加载中
    try {
      // 调用登录接口
      const res = await login(username, password)
      if (res.success) {
        // 登录成功，展示文案，并通知上层（传出 JWT）
        setMessage(res.message ?? '登录成功')
        onLoginSuccess?.(res.token ?? null)
      } else {
        // 登录失败，展示后端返回的错误文案（或默认文案）
        setError(res.error ?? '登录失败')
      }
    } catch {
      // 网络异常（例如后端不可达）
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false) // 无论成功失败，都结束加载态
    }
  }

  return (
    // 登录表单容器
    <form className="login-form" onSubmit={onSubmit}>
      {/* 用户名输入框 */}
      <div className="form-item">
        <label htmlFor="username">用户名</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)} // 受控输入：更新用户名状态
          placeholder="请输入用户名"
          autoComplete="username"
        />
      </div>

      {/* 密码输入框 */}
      <div className="form-item">
        <label htmlFor="password">密码</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)} // 受控输入：更新密码状态
          placeholder="请输入密码"
          autoComplete="current-password"
        />
      </div>

      {/* 错误提示（有值才渲染） */}
      {error && <div className="form-error" role="alert">{error}</div>}

      {/* 成功提示（有值才渲染） */}
      {message && <div className="form-success">{message}</div>}

      {/* 提交按钮：加载中时禁用并展示“登录中…” */}
      <button className="submit-btn" type="submit" disabled={loading}>
        {loading ? '登录中…' : '登录'}
      </button>
    </form>
  )
}
