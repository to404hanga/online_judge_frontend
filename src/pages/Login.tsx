import LoginForm from '../components/LoginForm'
import './Login.css'

type Props = {
  onLoginSuccess?: (token: string | null) => void
}

export default function LoginPage({ onLoginSuccess }: Props) {
  return (
    <div className="login-page">
      <div className="login-canvas">
        <div className="login-card">
          <h1 className="login-title">登录</h1>
          <LoginForm onLoginSuccess={onLoginSuccess} />
        </div>
      </div>
    </div>
  )
}
