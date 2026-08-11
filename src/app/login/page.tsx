'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await response.json()

      if (data.success) {
        // Redirect to dashboard page
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(data.error || 'Login gagal. Periksa kembali username & password.')
      }
    } catch (err) {
      setError('Koneksi bermasalah. Pastikan server berjalan.')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (roleUsername: string) => {
    setUsername(roleUsername)
    setPassword('password123')
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: roleUsername, password: 'password123' })
      })
      const data = await response.json()

      if (data.success) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Koneksi bermasalah.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 flex flex-col justify-center items-center px-4 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      {/* Visual Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass rounded-2xl shadow-2xl p-8 z-10 border border-slate-800">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <svg className="w-10 h-10 text-sky-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">SI-BUDI</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-100">Evaluasi Kinerja Bulanan</h1>
          <p className="text-sm text-slate-400 mt-1">BPS Kabupaten Sigi</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="username">Username</label>
            <div className="relative">
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-lg text-xs leading-relaxed text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium rounded-lg shadow-lg hover:shadow-sky-500/15 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-50"
          >
            {loading ? 'Masuk...' : 'Masuk ke Dasbor'}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800/80"></div></div>
          <span className="relative bg-slate-950 px-3 text-xs text-slate-500 tracking-wider uppercase font-medium">Demo Quick Login</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button onClick={() => quickLogin('kepala')} className="px-3 py-2 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-all text-left flex flex-col">
            <span className="font-bold text-sky-400">Kepala</span>
            <span className="text-[10px] text-slate-400 truncate">Budi Santoso</span>
          </button>
          <button onClick={() => quickLogin('ketuatim')} className="px-3 py-2 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-all text-left flex flex-col">
            <span className="font-bold text-indigo-400">Ketua Tim</span>
            <span className="text-[10px] text-slate-400 truncate">Andi Pratama</span>
          </button>
          <button onClick={() => quickLogin('pegawai')} className="px-3 py-2 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-all text-left flex flex-col">
            <span className="font-bold text-emerald-400">Anggota</span>
            <span className="text-[10px] text-slate-400 truncate">Rian Hidayat</span>
          </button>
          <button onClick={() => quickLogin('admin')} className="px-3 py-2 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-all text-left flex flex-col">
            <span className="font-bold text-amber-400">Admin</span>
            <span className="text-[10px] text-slate-400 truncate">Sistem</span>
          </button>
        </div>
      </div>
    </main>
  )
}
