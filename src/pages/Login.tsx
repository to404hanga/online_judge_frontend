import LoginForm from '../components/LoginForm'
import './Login.css'

// 登录页容器：负责页面布局与样式挂载，包含标题与登录表单
export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-canvas">
        <div className="login-card">
          <h1 className="login-title">登录</h1>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
