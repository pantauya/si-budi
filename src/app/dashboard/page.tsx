'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  nip: string
  name: string
  username: string
  role: string
  annualPlans?: AnnualPlan[]
}

interface AnnualPlan {
  id: string
  title: string
  userId: string
  year: number
}

interface Activity {
  id: string
  name: string
  status: 'BELUM_DILAKSANAKAN' | 'SEDANG_BERLANGSUNG' | 'MENUNGGU_BUKTI' | 'LENGKAP' | 'DINILAI'
  targetVolume: number
  unit: string
  annualPlanId: string
  createdById: string
  dateSubmitted?: string
  annualPlan: AnnualPlan
  creator: User
  members: { user: User }[]
  evidences: { evidenceFile: { id: string; driveLink: string; fileName: string; uploader?: User } }[]
  assessments: Assessment[]
  createdAt: string
  startDate?: string
  endDate?: string
  googleDriveFolderLink?: string
}

interface Assessment {
  id: string
  capaian: number
  kepatuhan: number
  profesionalisme: number
  nilaiAkhir: number
  predikat: string
  feedback?: string
  evaluatorId: string
  createdAt: string
}

interface ActivityLog {
  id: string
  userId: string
  action: string
  details?: string
  createdAt: string
  user: User
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'activities' | 'calendar' | 'sync' | 'audit'>('summary')
  const [activities, setActivities] = useState<Activity[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Form states
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [actName, setActName] = useState('')
  const [actTarget, setActTarget] = useState('')
  const [actUnit, setActUnit] = useState('')
  const [actPlanId, setActPlanId] = useState('')
  const [actMembers, setActMembers] = useState<string[]>([])
  const [actStartDate, setActStartDate] = useState(new Date().toISOString().split('T')[0])
  const [actEndDate, setActEndDate] = useState(new Date().toISOString().split('T')[0])
  const [isAdditionalPlan, setIsAdditionalPlan] = useState(false)

  // UI Theme & Layout States
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [highlightedActivityId, setHighlightedActivityId] = useState<string | null>(null)

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // Scroll to highlighted activity
  useEffect(() => {
    if (activeTab === 'activities' && highlightedActivityId) {
      setTimeout(() => {
        const el = document.getElementById(`activity-card-${highlightedActivityId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add('ring-2', 'ring-sky-500')
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-sky-500')
          }, 3000)
        }
      }, 300)
    }
  }, [activeTab, highlightedActivityId])

  // Evidence upload states
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadAct, setUploadAct] = useState<Activity | null>(null)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [activityUploadFiles, setActivityUploadFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  // Eval states
  const [showEvalModal, setShowEvalModal] = useState(false)
  const [evalAct, setEvalAct] = useState<Activity | null>(null)
  const [evalCapaian, setEvalCapaian] = useState('')
  const [evalKepatuhan, setEvalKepatuhan] = useState('')
  const [evalProfesionalisme, setEvalProfesionalisme] = useState('')
  const [evalFeedback, setEvalFeedback] = useState('')

  // Sync state
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [syncLogs, setSyncLogs] = useState<string[]>([])
  const [syncing, setSyncing] = useState(false)

  // Copy link state and handler
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const handleCopyLink = (link: string, id: string) => {
    const fullLink = link.startsWith('/') 
      ? `${window.location.origin}${link}` 
      : link
    navigator.clipboard.writeText(fullLink).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }).catch(err => {
      console.error('Gagal menyalin tautan:', err)
    })
  }

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null)
  const [showCalendarDayModal, setShowCalendarDayModal] = useState(false)

  // Load cookie user on mount
  useEffect(() => {
    const checkUser = async () => {
      const cookies = document.cookie.split(';').reduce((acc, c) => {
        const [k, v] = c.trim().split('=')
        acc[k] = v
        return acc
      }, {} as Record<string, string>)

      if (cookies['sibudi_session']) {
        try {
          const user = JSON.parse(decodeURIComponent(cookies['sibudi_session']))
          setCurrentUser(user)
        } catch (e) {
          router.push('/login')
        }
      } else {
        router.push('/login')
      }
    }
    checkUser()
  }, [router])

  // Fetch initial data
  useEffect(() => {
    if (!currentUser) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const actRes = await fetch(`/api/activities?userId=${currentUser.id}&role=${currentUser.role}`, { cache: 'no-store' })
        const actData = await actRes.json()
        if (actData.success) setActivities(actData.activities)

        const usersRes = await fetch('/api/users')
        const usersData = await usersRes.json()
        if (usersData.success) setUsers(usersData.users)

        if (currentUser.role === 'admin') {
          const logsRes = await fetch('/api/logs')
          const logsData = await logsRes.json()
          if (logsData.success) setLogs(logsData.logs)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentUser])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const triggerSync = () => {
    setShowSyncModal(true)
    setSyncing(true)
    setSyncProgress(0)
    setSyncLogs(['Menghubungi API KipAPP BPS...', 'Mendapatkan data otentikasi...'])

    const steps = [
      { p: 20, l: 'Mengunduh Matriks Rencana Kinerja Level 1 (Sekretariat/IPM)...' },
      { p: 50, l: 'Mengunduh Matriks Rencana Kinerja Level 2 (Tim Kerja Sosial & Neraca Wilayah)...' },
      { p: 80, l: 'Mencocokkan NIP Pegawai dengan butir SKP Tahunan 2026...' },
      { p: 100, l: 'Sinkronisasi berhasil! 10 Butir SKP Tahunan diimpor ke SI-BUDI.' }
    ]

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setSyncProgress(step.p)
        setSyncLogs(prev => [...prev, step.l])
        if (step.p === 100) {
          setSyncing(false)
          fetch('/api/seed').then(() => {
            router.refresh()
            // reload list
            if (currentUser) {
              fetch(`/api/activities?userId=${currentUser.id}&role=${currentUser.role}`, { cache: 'no-store' })
                .then(r => r.json())
                .then(data => {
                  if (data.success) setActivities(data.activities)
                })
            }
          })
        }
      }, (idx + 1) * 1000)
    })
  }

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    setUploading(true)
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: actName,
          targetVolume: actTarget,
          unit: actUnit,
          annualPlanId: isAdditionalPlan ? null : actPlanId,
          createdById: currentUser.id,
          members: currentUser.role === 'ketua_tim' ? actMembers : [],
          startDate: actStartDate,
          endDate: actEndDate,
          createdAt: actStartDate ? new Date(actStartDate).toISOString() : undefined
        })
      })
      const data = await res.json()

      if (data.success) {
        // Upload any attached files if the user is a member (anggota)
        if (currentUser.role === 'anggota' && activityUploadFiles.length > 0) {
          const uploadPromises = activityUploadFiles.map(async (file) => {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('userId', currentUser.id)
            formData.append('activityId', data.activity.id)

            const uploadRes = await fetch('/api/upload', {
              method: 'POST',
              body: formData
            })
            return uploadRes.json()
          })
          
          await Promise.all(uploadPromises)
        }

        // Refresh list
        const listRes = await fetch(`/api/activities?userId=${currentUser.id}&role=${currentUser.role}`, { cache: 'no-store' })
        const listData = await listRes.json()
        if (listData.success) setActivities(listData.activities)

        // Reset forms
        setActName('')
        setActTarget('')
        setActUnit('')
        setActPlanId('')
        setActMembers([])
        setActivityUploadFiles([])
        setActStartDate(new Date().toISOString().split('T')[0])
        setActEndDate(new Date().toISOString().split('T')[0])
        setIsAdditionalPlan(false)
        setShowActivityModal(false)
      } else {
        alert('Gagal membuat kegiatan: ' + data.error)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !uploadAct || uploadFiles.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = uploadFiles.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('userId', currentUser.id)
        formData.append('activityId', uploadAct.id)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        return res.json()
      })

      const results = await Promise.all(uploadPromises)
      const failed = results.filter(r => !r.success)

      if (failed.length === 0) {
        // Refresh list
        const listRes = await fetch(`/api/activities?userId=${currentUser.id}&role=${currentUser.role}`, { cache: 'no-store' })
        const listData = await listRes.json()
        if (listData.success) setActivities(listData.activities)

        setShowUploadModal(false)
        setUploadFiles([])
        setUploadAct(null)
      } else {
        alert(`Gagal mengunggah ${failed.length} berkas.`)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleEvaluateActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !evalAct) return

    try {
      const res = await fetch(`/api/activities/${evalAct.id}/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluatorId: currentUser.id,
          capaian: evalCapaian,
          kepatuhan: evalKepatuhan,
          profesionalisme: evalProfesionalisme,
          feedback: evalFeedback
        })
      })
      const data = await res.json()

      if (data.success) {
        // Refresh list
        const listRes = await fetch(`/api/activities?userId=${currentUser.id}&role=${currentUser.role}`, { cache: 'no-store' })
        const listData = await listRes.json()
        if (listData.success) setActivities(listData.activities)

        // Reset
        setEvalCapaian('')
        setEvalKepatuhan('')
        setEvalProfesionalisme('')
        setEvalFeedback('')
        setShowEvalModal(false)
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (!currentUser) return null

  // Calculate quick stats
  const totalAct = activities.length
  const completedAct = activities.filter(a => a.status === 'DINILAI').length
  const pendingAct = activities.filter(a => a.status === 'MENUNGGU_BUKTI').length
  const inProgressAct = activities.filter(a => a.status === 'SEDANG_BERLANGSUNG').length

  const evaluatedActivities = activities.filter(a => a.status === 'DINILAI')
  const avgScore = evaluatedActivities.length > 0
    ? (evaluatedActivities.reduce((acc, curr) => acc + (curr.assessments[0]?.nilaiAkhir || 0), 0) / evaluatedActivities.length).toFixed(2)
    : '0.00'

  // Calculate Tukin reduction simulation (H+5, 0.05% cut)
  const overdueCount = activities.filter(a => {
    const isUncompleted = a.status !== 'DINILAI' && a.status !== 'LENGKAP'
    const ageInMs = Date.now() - new Date(a.createdAt).getTime()
    const ageInDays = ageInMs / (1000 * 60 * 60 * 24)
    return isUncompleted && ageInDays >= 5
  }).length
  const estimatedTukinCut = overdueCount * 0.05

  // Calendar logic helpers
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayIndex = new Date(year, month, 1).getDay()

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  // Tukin per pegawai list logic for Pimpinan/Kepala
  const pegawaiUsers = users.filter(u => u.role === 'anggota')
  const getPegawaiTukinStats = (pegUserId: string) => {
    const pegActivities = activities.filter(a => a.createdById === pegUserId || a.members.some(m => m.user.id === pegUserId))
    const total = pegActivities.length
    const completed = pegActivities.filter(a => a.status === 'DINILAI').length
    const evaluated = pegActivities.filter(a => a.status === 'DINILAI')
    const avg = evaluated.length > 0
      ? (evaluated.reduce((acc, curr) => acc + (curr.assessments[0]?.nilaiAkhir || 0), 0) / evaluated.length).toFixed(2)
      : '0.00'
    const overdue = pegActivities.filter(a => {
      const isUncompleted = a.status !== 'DINILAI' && a.status !== 'LENGKAP'
      const ageInMs = Date.now() - new Date(a.createdAt).getTime()
      const ageInDays = ageInMs / (1000 * 60 * 60 * 24)
      return isUncompleted && ageInDays >= 5
    }).length
    const cut = overdue * 0.05

    return { total, completed, avg, cut }
  }

  return (
    <div className={`flex-1 flex flex-col md:flex-row h-screen overflow-hidden font-sans transition-colors duration-300 ${theme === 'light' ? 'light-mode bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        html, body {
          height: 100vh !important;
          overflow: hidden !important;
        }
        .light-mode .glass {
          background: rgba(255, 255, 255, 0.85) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          border-color: rgba(203, 213, 225, 0.7) !important;
          color: #0f172a !important;
        }
        .light-mode .bg-slate-800 {
          background-color: #f1f5f9 !important;
          color: #334155 !important;
          border-color: #cbd5e1 !important;
        }
        .light-mode input, .light-mode select, .light-mode textarea {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        .light-mode table th {
          background-color: #f1f5f9 !important;
          color: #475569 !important;
          border-color: #cbd5e1 !important;
        }
        .light-mode table thead tr {
          background-color: #f1f5f9 !important;
        }
        .light-mode table td {
          color: #1e293b !important;
          border-color: #cbd5e1 !important;
        }
        .light-mode table tr {
          border-color: #e2e8f0 !important;
        }
        .light-mode .text-slate-400 {
          color: #475569 !important;
        }
        .light-mode .text-slate-300 {
          color: #334155 !important;
        }
        .light-mode .text-slate-200 {
          color: #1e293b !important;
        }
        .light-mode .text-white {
          color: #0f172a !important;
        }
        .light-mode .border-slate-800, .light-mode .border-slate-800\\/80, .light-mode .border-slate-850 {
          border-color: #cbd5e1 !important;
        }
        .light-mode aside {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
        }
        .light-mode aside button {
          color: #475569 !important;
        }
        .light-mode aside button:hover {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
        }
        .light-mode aside .border-b, .light-mode aside .border-t {
          border-color: #cbd5e1 !important;
        }
        .light-mode aside .text-white {
          color: #0f172a !important;
        }
        .light-mode header {
          background-color: rgba(255, 255, 255, 0.8) !important;
          border-color: #cbd5e1 !important;
        }
        .light-mode header h2 {
          color: #0f172a !important;
        }
        .light-mode .bg-slate-900\\/40 {
          background-color: rgba(241, 245, 249, 0.5) !important;
        }
        .light-mode .bg-slate-900 {
          background-color: #ffffff !important;
        }
        .light-mode .bg-slate-950 {
          background-color: #f8fafc !important;
        }
        .light-mode .bg-slate-950\\/40 {
          background-color: rgba(226, 232, 240, 0.4) !important;
        }
        .light-mode .border-sky-850 {
          border-color: rgba(14, 165, 233, 0.3) !important;
        }
        .light-mode .bg-sky-950\\/40 {
          background-color: rgba(14, 165, 233, 0.05) !important;
        }
        .light-mode .text-sky-400 {
          color: #0284c7 !important;
        }
        .light-mode .text-sky-300 {
          color: #0369a1 !important;
        }
        .light-mode .bg-sky-500\\/10 {
          background-color: rgba(14, 165, 233, 0.15) !important;
        }
        .light-mode .text-emerald-400 {
          color: #059669 !important;
        }
        .light-mode .bg-emerald-500\\/10 {
          background-color: rgba(16, 185, 129, 0.15) !important;
        }
        .light-mode .text-amber-400 {
          color: #d97706 !important;
        }
        .light-mode .bg-amber-500\\/10 {
          background-color: rgba(245, 158, 11, 0.15) !important;
        }
        .light-mode .text-slate-100 {
          color: #0f172a !important;
        }
        .light-mode .text-slate-500 {
          color: #475569 !important;
        }
        .light-mode h1, .light-mode h2, .light-mode h3, .light-mode h4, .light-mode h5, .light-mode h6 {
          color: #0f172a !important;
        }
        .light-mode .bg-slate-900\\/60 {
          background-color: #f1f5f9 !important;
        }
        .light-mode .bg-slate-900\\/10 {
          background-color: rgba(241, 245, 249, 0.2) !important;
        }
        .light-mode .bg-slate-800\\/50 {
          background-color: rgba(241, 245, 249, 0.5) !important;
        }
        .light-mode .hover\\:bg-slate-800\\/50:hover {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
        }
        .light-mode .hover\\:bg-slate-700:hover {
          background-color: #e2e8f0 !important;
          color: #0f172a !important;
        }
        .light-mode .border-slate-800\\/80 {
          border-color: #cbd5e1 !important;
        }
        .light-mode .border-slate-800\\/40 {
          border-color: #cbd5e1 !important;
        }
      `}} />
      
      {/* Sidebar Section */}
      <aside className={`w-full ${sidebarCollapsed ? 'md:w-20' : 'md:w-64'} md:h-screen md:sticky md:top-0 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 z-30 flex-shrink-0`}>
        <div className={`p-6 border-b border-slate-800 flex items-center ${sidebarCollapsed ? 'justify-center px-4' : 'justify-between'} gap-3`}>
          <div className="flex items-center gap-3 min-w-0">
            <svg className="w-7 h-7 text-sky-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <span className="text-xl font-extrabold text-white tracking-tight block truncate">SI-BUDI</span>
                <span className="block text-[10px] text-slate-400 font-medium tracking-wide truncate">BPS KAB. SIGI</span>
              </div>
            )}
          </div>
          <button 
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors hidden md:block cursor-pointer"
            title={sidebarCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
          >
            {sidebarCollapsed ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
              </svg>
            )}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <button
            onClick={() => setActiveTab('summary')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start'} gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'summary' ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            title="Dasbor Utama"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            {!sidebarCollapsed && <span>Dasbor Utama</span>}
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start'} gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'activities' ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            title="Rencana Kinerja & Bukti"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5A3.375 3.375 0 0010.125 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V14.25z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15h6M9 18h6M9 12h3" />
            </svg>
            {!sidebarCollapsed && <span>Rencana Kinerja & Bukti</span>}
          </button>

          {/* Calendar tab - shown to everyone except admin */}
          {currentUser.role !== 'admin' && (
            <button
              onClick={() => setActiveTab('calendar')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start'} gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'calendar' ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
              title="Kalender Kegiatan"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
              </svg>
              {!sidebarCollapsed && <span>Kalender Kegiatan</span>}
            </button>
          )}

          <button
            onClick={() => setActiveTab('sync')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start'} gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'sync' ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            title="Integrasi KipAPP"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            {!sidebarCollapsed && <span>Integrasi KipAPP</span>}
          </button>

          {/* System logs tab - restricted to admin only */}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start'} gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'audit' ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
              title="Audit Log Sistem"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              {!sidebarCollapsed && <span>Audit Log Sistem</span>}
            </button>
          )}
        </nav>

        {/* User profile footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-sky-400 uppercase flex-shrink-0">
              {currentUser.name[0]}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{currentUser.role.replace('_', ' ')}</p>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors mx-auto md:mx-0 cursor-pointer" title="Keluar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="px-8 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/10 backdrop-blur-md sticky top-0 z-20 transition-all duration-300">
          <h2 className="text-lg font-semibold text-white uppercase tracking-wider">
            {activeTab === 'summary' && 'Ringkasan Kinerja'}
            {activeTab === 'activities' && 'Rencana Kinerja Bulanan'}
            {activeTab === 'calendar' && 'Kalender Rencana Kegiatan'}
            {activeTab === 'sync' && 'Sinkronisasi KipAPP BPS'}
            {activeTab === 'audit' && 'Jejak Audit Aktivitas'}
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-full border transition-all cursor-pointer ${theme === 'light' ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100' : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'}`}
              title={theme === 'light' ? "Ubah ke Mode Gelap" : "Ubah ke Mode Terang"}
            >
              {theme === 'light' ? (
                <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m8.94-8.94h-2.25M4.14 12H1.89m17.653-7.653l-1.591 1.591M6.809 17.191l-1.591 1.591m12.728 0l-1.591-1.591M6.809 6.809L5.218 5.218M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
                </svg>
              )}
            </button>
            <div className={`text-xs px-3 py-1.5 rounded-full border transition-all ${theme === 'light' ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
              Tahun Kerja: <span className="font-bold text-sky-400">2026</span>
            </div>
          </div>
        </header>

        <div className="p-8">
          
          {/* TAB: SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-8">
              {/* Stat grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="glass p-6 rounded-xl border border-slate-800/80">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Kegiatan</span>
                  <span className="block text-3xl font-bold mt-2 text-white">{totalAct}</span>
                </div>
                <div className="glass p-6 rounded-xl border border-slate-800/80">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Telah Dinilai</span>
                  <span className="block text-3xl font-bold mt-2 text-emerald-400">{completedAct}</span>
                </div>
                <div className="glass p-6 rounded-xl border border-slate-800/80">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Belum Dinilai</span>
                  <span className="block text-3xl font-bold mt-2 text-amber-400">{totalAct - completedAct}</span>
                </div>
                <div className="glass p-6 rounded-xl border border-slate-800/80">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Rerata Nilai Bulanan</span>
                  <span className="block text-3xl font-bold mt-2 text-sky-400">{avgScore}</span>
                </div>
              </div>

              {/* Tukin section - shown to all roles EXCEPT admin */}
              {currentUser.role !== 'admin' && (
                <div className="glass p-6 rounded-xl border border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Kepatuhan Penyampaian Bukti Dukung</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl">Berdasarkan peraturan internal, keterlambatan pelaporan atau pengumpulan bukti dukung bulanan dikenakan rekomendasi pemotongan tunjangan kinerja (Tukin).</p>
                  </div>
                  <div className={`px-5 py-3 rounded-lg border flex flex-col items-center ${estimatedTukinCut > 0 ? 'bg-rose-500/10 border-rose-500/25' : 'bg-emerald-500/10 border-emerald-500/25'}`}>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${estimatedTukinCut > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>Rekomendasi Pemotongan Tukin Anda</span>
                    <span className={`text-xl font-bold mt-1 ${estimatedTukinCut > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {estimatedTukinCut > 0 ? `-${estimatedTukinCut.toFixed(2)}% (${overdueCount} Kegiatan Lewat H+5)` : '0% (Lengkap & Tepat Waktu)'}
                    </span>
                  </div>
                </div>
              )}

              {/* Pimpinan (Kepala) View: Rekomendasi Tukin Per Pegawai */}
              {currentUser.role === 'pimpinan' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Rekomendasi Pemotongan Tukin Per Pegawai</h3>
                  </div>
                  <div className="overflow-x-auto glass rounded-xl border border-slate-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/30">
                          <th className="p-4 font-semibold">Nama Pegawai</th>
                          <th className="p-4 font-semibold">NIP</th>
                          <th className="p-4 font-semibold">Total Kegiatan</th>
                          <th className="p-4 font-semibold">Rata-rata Nilai</th>
                          <th className="p-4 font-semibold">Rekomendasi Potong Tukin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {pegawaiUsers.map(peg => {
                          const stats = getPegawaiTukinStats(peg.id)
                          return (
                            <tr key={peg.id} className="hover:bg-slate-900/20">
                              <td className="p-4 font-medium text-slate-200">{peg.name}</td>
                              <td className="p-4 text-slate-400">{peg.nip}</td>
                              <td className="p-4 text-slate-300">{stats.completed} / {stats.total} Selesai</td>
                              <td className="p-4 text-slate-100 font-bold">{stats.avg}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  stats.cut > 0 ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                }`}>
                                  {stats.cut > 0 ? `Potong ${stats.cut.toFixed(2)}%` : '0% (Aman)'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                        {pegawaiUsers.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-500">Tidak ada data pegawai.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recent activities list */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Kegiatan Terbaru</h3>
                <div className="overflow-auto max-h-[450px] glass rounded-xl border border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/30 sticky top-0 bg-slate-950/90 backdrop-blur-sm z-10">
                        <th className="p-4 font-semibold">Nama Kegiatan</th>
                        <th className="p-4 font-semibold">Volume</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold">Nilai Akhir</th>
                        <th className="p-4 font-semibold">Evaluator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {activities.map(act => (
                        <tr key={act.id} className="hover:bg-slate-900/20">
                          <td className="p-4 font-medium text-slate-200">
                            <button
                              onClick={() => {
                                setHighlightedActivityId(act.id)
                                setActiveTab('activities')
                              }}
                              className="hover:underline text-sky-400 hover:text-sky-300 font-semibold text-left transition-colors cursor-pointer"
                            >
                              {act.name}
                            </button>
                          </td>
                          <td className="p-4 text-slate-300">{act.targetVolume} {act.unit}</td>
                          <td className="p-4">
                             {(() => {
                               if (act.status === 'DINILAI') {
                                 return (
                                   <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                     DINILAI
                                   </span>
                                 )
                               } else if (act.evidences && act.evidences.length > 0) {
                                 return (
                                   <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                                     DIPERIKSA
                                   </span>
                                 )
                               } else {
                                 return (
                                   <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                     MENUNGGU BUKTI DUKUNG
                                   </span>
                                 )
                               }
                             })()}
                           </td>
                          <td className="p-4 text-slate-100 font-bold">{act.assessments[0]?.nilaiAkhir?.toFixed(2) || '-'}</td>
                          <td className="p-4 text-slate-400">{act.assessments[0] ? 'Ketua Tim' : '-'}</td>
                        </tr>
                      ))}
                      {activities.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500">Belum ada aktivitas kegiatan.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ACTIVITIES */}
          {activeTab === 'activities' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Daftar Rencana Kinerja Bulanan</h3>
                {(currentUser.role === 'anggota' || currentUser.role === 'ketua_tim') && (
                  <button
                    onClick={() => {
                      // Pre-fill plans
                      const cur = users.find(u => u.id === currentUser.id)
                      if (cur?.annualPlans && cur.annualPlans.length > 0) {
                        setActPlanId(cur.annualPlans[0].id)
                      }
                      setShowActivityModal(true)
                    }}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow transition-all hover:scale-[1.01]"
                  >
                    Tambah Kegiatan Bulanan
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {activities.map(act => {
                  const hasEvidence = act.evidences && act.evidences.length > 0
                  const isCreatorOrMember = currentUser.id === act.createdById || act.members.some(m => m.user.id === currentUser.id)

                  return (
                    <div key={act.id} id={`activity-card-${act.id}`} className="glass p-6 rounded-xl border border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all duration-500">
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                           {(() => {
                             if (act.status === 'DINILAI') {
                               return (
                                 <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                   DINILAI
                                 </span>
                               )
                             } else if (act.evidences && act.evidences.length > 0) {
                               return (
                                 <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                   DIPERIKSA
                                 </span>
                               )
                             } else {
                               return (
                                 <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                   MENUNGGU BUKTI DUKUNG
                                 </span>
                               )
                             }
                           })()}
                          <span className="text-[10px] text-slate-500">Milik: <strong className="text-slate-400">{act.creator.name}</strong></span>
                          
                          {act.members.length > 1 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/5 text-sky-400 border border-sky-500/10">
                              Kolaborasi: {act.members.map(m => m.user.name).join(', ')}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-slate-100">{act.name}</h4>
                        <p className="text-xs text-slate-400 truncate"><span className="text-slate-500 font-medium">SKP Induk:</span> {act.annualPlan?.title || 'Rencana Kinerja Tambahan'}</p>
                        <p className="text-xs text-slate-400">Target: <strong className="text-slate-300">{act.targetVolume} {act.unit}</strong></p>
                        {act.startDate && act.endDate ? (
                          <p className="text-xs text-slate-400">Rentang Waktu: <strong className="text-slate-300">{new Date(act.startDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})} - {new Date(act.endDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</strong></p>
                        ) : (
                          <p className="text-xs text-slate-400">Tanggal: <strong className="text-slate-300">{new Date(act.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</strong></p>
                        )}
                        
                        {/* Evidence shared link info */}
                        {hasEvidence ? (
                          <div className="text-xs bg-sky-950/40 border border-sky-850 p-2.5 rounded-lg text-sky-400 flex flex-col gap-2 mt-2 max-w-lg">
                            {act.googleDriveFolderLink && (
                              <div className="flex items-center justify-between gap-2 pb-2 border-b border-sky-850/40">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Folder Utama Google Drive:</span>
                                <a 
                                  href={act.googleDriveFolderLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-sky-400 hover:underline font-bold flex items-center gap-1 text-[10px]"
                                >
                                  <span>Buka Folder Kegiatan</span>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                  </svg>
                                </a>
                              </div>
                            )}
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Berkas Bukti Dukung ({act.evidences.length}):</span>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {act.evidences.map((ev, idx) => (
                                <div key={ev.evidenceFile.id || idx} className="flex items-center justify-between gap-1.5 flex-wrap bg-slate-900/60 p-1.5 rounded border border-slate-800">
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <svg className="w-4 h-4 text-sky-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                    </svg>
                                    <a href={ev.evidenceFile.driveLink} target="_blank" rel="noopener noreferrer" className="hover:underline font-bold truncate">
                                      {ev.evidenceFile.fileName}
                                    </a>
                                  </div>
                                  <button
                                    onClick={() => handleCopyLink(ev.evidenceFile.driveLink, ev.evidenceFile.id)}
                                    className="px-2 py-1 text-[10px] bg-sky-500/25 hover:bg-sky-500/40 text-sky-300 rounded font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    {copiedId === ev.evidenceFile.id ? (
                                      <>
                                        <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                        Tersalin!
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z" />
                                        </svg>
                                        Salin
                                      </>
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-500 italic mt-2">Belum ada bukti dukung yang diunggah.</p>
                        )}

                        {/* Assessment feedback */}
                        {act.status === 'DINILAI' && act.assessments[0]?.feedback && (
                          <div className="text-xs bg-slate-900 border-l-2 border-emerald-500 p-2.5 rounded-r-lg text-slate-300 italic mt-2 max-w-lg">
                            <strong>Umpan Balik:</strong> "{act.assessments[0].feedback}"
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {act.status === 'DINILAI' && act.assessments[0] && (
                          <div className="text-right flex flex-col bg-slate-900/60 border border-slate-800 rounded-lg p-3">
                            <span className="text-[9px] uppercase font-bold text-slate-500">Skor Evaluasi</span>
                            <span className="text-base font-black text-emerald-400">{act.assessments[0].nilaiAkhir.toFixed(2)}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">{act.assessments[0].predikat}</span>
                          </div>
                        )}

                        {/* Upload / Edit Bukti Dukung button - shown to creator, members, or ketua_tim */}
                        {(isCreatorOrMember || currentUser.role === 'ketua_tim') && currentUser.role !== 'pimpinan' && (
                          <button
                            onClick={() => {
                              setUploadAct(act)
                              setShowUploadModal(true)
                            }}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            {hasEvidence ? 'Edit Bukti Dukung' : 'Unggah Bukti Dukung'}
                          </button>
                        )}

                        {(currentUser.role === 'ketua_tim' || currentUser.role === 'pimpinan') && act.evidences && act.evidences.length > 0 && act.status !== 'DINILAI' && (
                           <button
                             onClick={() => {
                               setEvalAct(act)
                               setShowEvalModal(true)
                             }}
                             className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow"
                           >
                             Beri Penilaian (SKP)
                           </button>
                         )}
                      </div>
                    </div>
                  )
                })}
                {activities.length === 0 && (
                  <p className="p-8 text-center text-slate-500 glass rounded-xl border border-slate-800">Belum ada aktivitas kegiatan.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB: CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Kalender Rencana Kegiatan</h3>
                  <p className="text-xs text-slate-400 mt-1">Gunakan navigasi untuk melihat daftar kegiatan bulanan yang dibuat berdasarkan tanggal pembuatannya.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={prevMonth} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold">
                    &lt; Sebelum
                  </button>
                  <span className="text-sm font-bold text-white min-w-32 text-center">
                    {monthNames[month]} {year}
                  </span>
                  <button onClick={nextMonth} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold">
                    Sesudah &gt;
                  </button>
                </div>
              </div>

              {/* Grid calendar */}
              <div className="glass p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase">
                  <div>Min</div>
                  <div>Sen</div>
                  <div>Sel</div>
                  <div>Rab</div>
                  <div>Kam</div>
                  <div>Jum</div>
                  <div>Sab</div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {/* Empty cells before month start */}
                  {Array.from({ length: firstDayIndex }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="h-28 bg-slate-900/10 border border-slate-900/40 rounded-lg opacity-25"></div>
                  ))}

                  {/* Month days */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const day = idx + 1
                    const dayDate = new Date(year, month, day)
                    const formatLocalDateString = (y: number, m: number, d: number) => {
                      const mm = String(m + 1).padStart(2, '0')
                      const dd = String(d).padStart(2, '0')
                      return `${y}-${mm}-${dd}`
                    }

                    const getLocalDateString = (dateInput: string | Date) => {
                      const d = new Date(dateInput)
                      const y = d.getFullYear()
                      const mm = String(d.getMonth() + 1).padStart(2, '0')
                      const dd = String(d.getDate()).padStart(2, '0')
                      return `${y}-${mm}-${dd}`
                    }

                    const dayStr = formatLocalDateString(year, month, day)
                    const dayActivities = activities.filter(act => {
                      if (act.startDate && act.endDate) {
                        const startStr = getLocalDateString(act.startDate)
                        const endStr = getLocalDateString(act.endDate)
                        return dayStr >= startStr && dayStr <= endStr
                      } else {
                        const createdStr = getLocalDateString(act.createdAt)
                        return dayStr === createdStr
                      }
                    })

                    return (
                      <div
                        key={`day-${day}`}
                        onClick={() => {
                          if (dayActivities.length > 0) {
                            setSelectedCalendarDay(day)
                            setShowCalendarDayModal(true)
                          }
                        }}
                        className={`h-28 bg-slate-900 border border-slate-800/80 rounded-lg p-2 flex flex-col justify-between transition-colors overflow-hidden ${
                          dayActivities.length > 0 ? 'hover:bg-slate-800/50 cursor-pointer border-sky-500/40' : ''
                        }`}
                      >
                        <span className="text-xs font-semibold text-slate-400">{day}</span>
                        <div className="flex-1 overflow-y-auto mt-1 space-y-1">
                          {dayActivities.slice(0, 2).map(act => (
                            <div key={act.id} className="text-[9px] px-1 py-0.5 rounded truncate bg-sky-500/10 text-sky-400 border border-sky-500/15">
                              {act.name}
                            </div>
                          ))}
                          {dayActivities.length > 2 && (
                            <span className="text-[8px] text-slate-500 block text-right font-medium">+{dayActivities.length - 2} Lainnya</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: SYNC KIPAPP */}
          {activeTab === 'sync' && (
            <div className="glass p-8 rounded-2xl border border-slate-800 max-w-2xl mx-auto space-y-6 text-center">
              <div className="flex justify-center">
                <svg className="w-16 h-16 text-sky-400 animate-bounce" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-100">Koneksi API KipAPP BPS</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">Hubungkan SI-BUDI langsung ke sistem KipAPP BPS untuk menyelaraskan target SKP tahunan seluruh pegawai BPS Kabupaten Sigi.</p>
              </div>
              <button
                onClick={triggerSync}
                className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg hover:shadow-sky-500/15"
              >
                Sinkronisasikan Sekarang
              </button>
            </div>
          )}

          {/* TAB: AUDIT LOG */}
          {activeTab === 'audit' && currentUser.role === 'admin' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Jejak Aktivitas Sistem</h3>
              <div className="glass rounded-xl border border-slate-800 overflow-hidden">
                <div className="divide-y divide-slate-800">
                  {logs.map(log => (
                    <div key={log.id} className="p-4 hover:bg-slate-900/10 flex justify-between items-start text-xs">
                      <div>
                        <span className="font-bold text-slate-300">{log.user?.name || 'Sistem'}</span>
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-sky-400 font-mono">{log.action}</span>
                        <p className="text-slate-400 mt-1">{log.details}</p>
                      </div>
                      <span className="text-[10px] text-slate-500">{new Date(log.createdAt).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <p className="p-6 text-center text-slate-500">Belum ada catatan log aktivitas.</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL: SINKRONISASI KIPAPP */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Integrasi KipAPP</h3>
            
            <div className="space-y-4">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 transition-all duration-500" style={{ width: `${syncProgress}%` }}></div>
              </div>
              <p className="text-xs text-slate-400 text-center">Sinkronisasi Kinerja {syncProgress}% selesai</p>
              
              <div className="bg-slate-900 border border-slate-800/60 rounded-lg p-3 h-32 overflow-y-auto font-mono text-[10px] text-slate-400 space-y-1">
                {syncLogs.map((l, i) => <p key={i}>&gt; {l}</p>)}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSyncModal(false)}
                disabled={syncing}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH KEGIATAN */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateActivity} className="w-full max-w-lg glass border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Tambah Kegiatan Bulanan</h3>

            <div className="flex items-center gap-2 pb-1">
              <input
                id="additionalPlanCheckbox"
                type="checkbox"
                checked={isAdditionalPlan}
                onChange={(e) => {
                  setIsAdditionalPlan(e.target.checked)
                  if (e.target.checked) {
                    setActPlanId("")
                  }
                }}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500 cursor-pointer"
              />
              <label htmlFor="additionalPlanCheckbox" className="text-xs font-bold text-slate-300 cursor-pointer select-none">
                Rencana Kinerja Tambahan (Tanpa SKP Induk)
              </label>
            </div>

            {!isAdditionalPlan && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Butir SKP Induk</label>
                <select
                  required={!isAdditionalPlan}
                  value={actPlanId}
                  onChange={(e) => setActPlanId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">-- Pilih Target SKP --</option>
                  {users.find(u => u.id === currentUser.id)?.annualPlans?.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                  {/* Fallback if user has no plans seeded yet but we need to create */}
                  {users.find(u => u.id === currentUser.id)?.annualPlans?.length === 0 && (
                    <option disabled>Belum ada SKP tahunan. Harap lakukan sinkronisasi.</option>
                  )}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nama / Uraian Kegiatan</label>
              <textarea
                required
                rows={3}
                value={actName}
                onChange={(e) => setActName(e.target.value)}
                placeholder="Deskripsi kegiatan bulanan..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Target Volume</label>
                <input
                  required
                  type="number"
                  value={actTarget}
                  onChange={(e) => setActTarget(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Satuan</label>
                <input
                  required
                  type="text"
                  value={actUnit}
                  onChange={(e) => setActUnit(e.target.value)}
                  placeholder="Laporan / Dokumen / Kuesioner"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Tanggal Mulai</label>
                <input
                  required
                  type="date"
                  value={actStartDate}
                  onChange={(e) => setActStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Tanggal Selesai</label>
                <input
                  required
                  type="date"
                  value={actEndDate}
                  onChange={(e) => setActEndDate(e.target.value)}
                  min={actStartDate}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Tagging Members (Pegawai) - Only shown to ketua_tim role */}
            {currentUser.role === 'ketua_tim' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Tag Anggota Kolaborator (Opsional)</label>
                <div className="bg-slate-900 border border-slate-850 rounded-lg p-3 max-h-36 overflow-y-auto space-y-2">
                  {users.filter(u => u.role === 'anggota' && u.id !== currentUser.id).map(u => (
                    <label key={u.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-slate-100">
                      <input
                        type="checkbox"
                        checked={actMembers.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setActMembers(prev => [...prev, u.id])
                          } else {
                            setActMembers(prev => prev.filter(id => id !== u.id))
                          }
                        }}
                        className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900 focus:ring-1"
                      />
                      <span>{u.name} ({u.nip})</span>
                    </label>
                  ))}
                  {users.filter(u => u.role === 'anggota' && u.id !== currentUser.id).length === 0 && (
                    <p className="text-[10px] text-slate-500 italic">Belum ada pegawai lain untuk ditag.</p>
                  )}
                </div>
              </div>
            )}

            {/* Direct multi-file upload for Anggota */}
            {currentUser.role === 'anggota' && (
              <div>
                <label className="block text-[11px] font-semibold text-sky-400 uppercase tracking-wider mb-1.5 font-bold">
                  Unggah Bukti Dukung (Bisa Lebih Dari 1 File)
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    if (e.target.files) {
                      setActivityUploadFiles(Array.from(e.target.files))
                    }
                  }}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-600/10 file:text-sky-400 hover:file:bg-sky-600/20 file:cursor-pointer"
                />
                {activityUploadFiles.length > 0 && (
                  <div className="mt-2 text-xs text-slate-400 space-y-1">
                    <span className="font-semibold text-slate-300">File Terpilih:</span>
                    <ul className="list-disc pl-4">
                      {activityUploadFiles.map((file, i) => (
                        <li key={i} className="truncate">{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setShowActivityModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
              >
                Simpan Rencana
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: UPLOAD FILE BUKTI DUKUNG */}
      {showUploadModal && uploadAct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleFileUpload} className="w-full max-w-md glass border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              {uploadAct.evidences.length > 0 ? 'Edit Bukti Dukung (Tautan Bersama)' : 'Unggah Bukti Dukung Baru'}
            </h3>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs space-y-1">
              <p><strong className="text-slate-400">Kegiatan:</strong> {uploadAct.name}</p>
              {uploadAct.evidences.length > 0 && (
                <p>
                  <strong className="text-slate-400">File Saat Ini:</strong>{' '}
                  <span className="text-sky-400 underline">{uploadAct.evidences[0].evidenceFile.fileName}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Pilih Berkas (Bisa Lebih Dari 1 File)</label>
              <input
                required
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={(e) => {
                  if (e.target.files) {
                    setUploadFiles(Array.from(e.target.files))
                  }
                }}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-600/10 file:text-sky-400 hover:file:bg-sky-600/20 file:cursor-pointer"
              />
              {uploadFiles.length > 0 && (
                <div className="mt-2 text-xs text-slate-400 space-y-1">
                  <span className="font-semibold text-slate-300">File Terpilih:</span>
                  <ul className="list-disc pl-4">
                    {uploadFiles.map((file, i) => (
                      <li key={i} className="truncate">{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false)
                  setUploadFiles([])
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                disabled={uploading}
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                disabled={uploading || uploadFiles.length === 0}
              >
                {uploading ? 'Mengunggah...' : 'Simpan Berkas'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EVALUASI / PENILAIAN */}
      {showEvalModal && evalAct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleEvaluateActivity} className="w-full max-w-lg glass border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Beri Penilaian & Evaluasi</h3>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs space-y-1">
              <p><strong className="text-slate-400">Pegawai:</strong> {evalAct.creator.name}</p>
              <p><strong className="text-slate-400">Kegiatan:</strong> {evalAct.name}</p>
              {evalAct.evidences.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  <span className="block text-slate-400 font-bold">Bukti Dukung ({evalAct.evidences.length}):</span>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {evalAct.evidences.map((ev, idx) => (
                      <div key={ev.evidenceFile.id || idx} className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                        <a href={ev.evidenceFile.driveLink} target="_blank" rel="noopener noreferrer" className="text-sky-400 underline hover:text-sky-300 truncate flex-1">
                          {ev.evidenceFile.fileName}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(ev.evidenceFile.driveLink, ev.evidenceFile.id)}
                          className="px-1.5 py-0.5 text-[9px] bg-sky-500/25 hover:bg-sky-500/40 text-sky-300 rounded font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === ev.evidenceFile.id ? (
                            <>
                              <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                              Tersalin!
                            </>
                          ) : (
                            <>
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z" />
                              </svg>
                              Salin
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Capaian (50%)</label>
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  value={evalCapaian}
                  onChange={(e) => setEvalCapaian(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Kepatuhan (30%)</label>
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  value={evalKepatuhan}
                  onChange={(e) => setEvalKepatuhan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Profesional (20%)</label>
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  value={evalProfesionalisme}
                  onChange={(e) => setEvalProfesionalisme(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Umpan Balik / Feedback</label>
              <textarea
                value={evalFeedback}
                onChange={(e) => setEvalFeedback(e.target.value)}
                placeholder="Berikan masukan kepada pegawai..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setShowEvalModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
              >
                Simpan Penilaian
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: DETAIL HARI KALENDER */}
      {showCalendarDayModal && selectedCalendarDay !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Kegiatan pada {selectedCalendarDay} {monthNames[month]} {year}
              </h3>
              <button
                onClick={() => {
                  setShowCalendarDayModal(false)
                  setSelectedCalendarDay(null)
                }}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                Tutup
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activities
                .filter(act => {
                  const formatLocalDateString = (y: number, m: number, d: number) => {
                    const mm = String(m + 1).padStart(2, '0')
                    const dd = String(d).padStart(2, '0')
                    return `${y}-${mm}-${dd}`
                  }

                  const getLocalDateString = (dateInput: string | Date) => {
                    const d = new Date(dateInput)
                    const y = d.getFullYear()
                    const mm = String(d.getMonth() + 1).padStart(2, '0')
                    const dd = String(d.getDate()).padStart(2, '0')
                    return `${y}-${mm}-${dd}`
                  }

                  const dayStr = formatLocalDateString(year, month, selectedCalendarDay)
                  if (act.startDate && act.endDate) {
                    const startStr = getLocalDateString(act.startDate)
                    const endStr = getLocalDateString(act.endDate)
                    return dayStr >= startStr && dayStr <= endStr
                  } else {
                    const createdStr = getLocalDateString(act.createdAt)
                    return dayStr === createdStr
                  }
                })
                .map(act => (
                  <div key={act.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                        {act.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400">Target: {act.targetVolume} {act.unit}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-white">{act.name}</h4>
                    <p className="text-[10px] text-slate-400">Pegawai: {act.creator.name}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
