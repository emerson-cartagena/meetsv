import { Calendar, LogOut, Settings } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
          <Calendar className="text-primary-600" size={24} />
          <span className="font-bold text-lg">MeetSV</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {user.role === 'admin' ? '👨‍💼 Admin' : '👤 Usuario'} • {user.email}
          </span>
          {user.role === 'admin' && (
            <Link to="/admin" className="btn-secondary text-sm flex items-center gap-1">
              <Settings size={14} /> Admin
            </Link>
          )}
          <button onClick={handleLogout} className="btn-secondary text-sm flex items-center gap-1">
            <LogOut size={14} /> Salir
          </button>
        </div>
      </div>
    </header>
  )
}
