/* ==========================================================================
   SI-BUDI Core JavaScript Logic
   Badan Pusat Statistik (BPS) Kabupaten Sigi
   ========================================================================== */

// --- Global Data Store & State Key ---
const STORAGE_KEY_USERS = 'sibudi_users';
const STORAGE_KEY_ACTIVITIES = 'sibudi_activities';
const STORAGE_KEY_KIPAPP = 'sibudi_kipapp_skp';
const SESSION_KEY_ACTIVE_USER = 'sibudi_active_user';

// --- Default Data Initialization (Bootstrapping) ---
const defaultUsers = [
    { id: '1', nip: '197005121993031001', name: 'Drs. Budi Santoso, M.Si.', username: 'kepala', password: 'kepala', role: 'kepala', type: '' },
    { id: '2', nip: '198508172007011003', name: 'Andi Pratama, S.Si., M.S.E.', username: 'ketuatim', password: 'ketuatim', role: 'pegawai', type: 'ketua_tim' },
    { id: '3', nip: '199511202018121002', name: 'Rian Hidayat, S.Tr.Stat.', username: 'pegawai', password: 'pegawai', role: 'pegawai', type: 'anggota' },
    { id: '4', nip: '199003152012102001', name: 'Siti Rahma, A.Md.', username: 'sekretaris', password: 'sekretaris', role: 'sekretaris', type: '' },
    { id: '5', nip: '000000000000000000', name: 'System Administrator', username: 'admin', password: 'admin', role: 'admin', type: '' },
    { id: '6', nip: '199704252020121001', name: 'Eko Prasetyo, S.E.', username: 'eko', password: 'eko', role: 'pegawai', type: 'anggota' },
    { id: '7', nip: '199602112019122002', name: 'Dewi Lestari, S.E.', username: 'dewi', password: 'dewi', role: 'pegawai', type: 'anggota' }
];

const defaultKipAppSKP = {
    // Andi Pratama (Ketua Tim)
    '2': [
        { id: 'skp-2-1', title: 'Terkoordinasinya penyusunan Neraca Wilayah Kabupaten Sigi 2026' },
        { id: 'skp-2-2', title: 'Terlaksananya monitoring, evaluasi, dan penilaian kinerja pegawai secara tepat waktu' },
        { id: 'skp-2-3', title: 'Meningkatnya kualitas koordinasi statistik sektoral di wilayah Kabupaten Sigi' }
    ],
    // Rian Hidayat (Anggota)
    '3': [
        { id: 'skp-3-1', title: 'Tersedianya Data Survei Sosial Ekonomi Nasional (Susenas) Maret 2026 yang Akurat' },
        { id: 'skp-3-2', title: 'Tersusunnya Laporan Publikasi Kabupaten Sigi Dalam Angka 2026 secara Tepat Waktu' },
        { id: 'skp-3-3', title: 'Terlaksananya Pengolahan dan Diseminasi Data Survei Angkatan Kerja Nasional (Sakernas) 2026' }
    ],
    // Eko Prasetyo (Anggota)
    '6': [
        { id: 'skp-6-1', title: 'Terlaksananya Survei Harga Perdagangan Besar dan Eceran Sektor Jasa 2026' },
        { id: 'skp-6-2', title: 'Tersedianya Kompilasi Laporan Publikasi Kecamatan Dalam Angka 2026' }
    ],
    // Dewi Lestari (Anggota)
    '7': [
        { id: 'skp-7-1', title: 'Tersedianya Data Indeks Pembangunan Manusia (IPM) Kabupaten Sigi 2026' },
        { id: 'skp-7-2', title: 'Terlaksananya Entri Dokumen Survei Ubinan Tanaman Pangan 2026' }
    ]
};

const defaultActivities = [
    {
        id: 'act-1',
        userId: '3', // Rian Hidayat
        skpId: 'skp-3-1',
        skpTitle: 'Tersedianya Data Survei Sosial Ekonomi Nasional (Susenas) Maret 2026 yang Akurat',
        name: 'Pengawasan dan Pemeriksaan Kuesioner Susenas Maret 2026 di Kecamatan Gumbasa',
        targetVolume: 45,
        unit: 'Kuesioner',
        evidence: 'https://drive.google.com/drive/folders/susenas-gumbasa-bps-sigi',
        tags: ['6'], // tagged Eko Prasetyo
        dateSubmitted: '2026-06-25',
        status: 'evaluated',
        evaluations: {
            kuantitas: 98,
            kualitas: 95,
            waktu: 95,
            average: 96.00,
            predicate: 'Sangat Baik',
            tukinDeduction: 0,
            evaluatorId: '2', // Andi Pratama
            evaluatorName: 'Andi Pratama, S.Si., M.S.E.',
            dateEvaluated: '2026-06-28',
            feedback: 'Kuesioner diperiksa dengan sangat teliti, minim eror pengolahan.'
        }
    },
    {
        id: 'act-2',
        userId: '3', // Rian Hidayat
        skpId: 'skp-3-3',
        skpTitle: 'Terlaksananya Pengolahan dan Diseminasi Data Survei Angkatan Kerja Nasional (Sakernas) 2026',
        name: 'Pengolahan dan Validasi Data Sakernas Semester I Kabupaten Sigi',
        targetVolume: 120,
        unit: 'Dokumen',
        evidence: 'https://drive.google.com/drive/folders/sakernas-sigi-sem1',
        tags: [],
        dateSubmitted: '2026-07-02',
        status: 'pending',
        evaluations: null
    },
    {
        id: 'act-3',
        userId: '2', // Andi Pratama
        skpId: 'skp-2-1',
        skpTitle: 'Terkoordinasinya penyusunan Neraca Wilayah Kabupaten Sigi 2026',
        name: 'Penyusunan Kerangka Neraca Produksi Kabupaten Sigi Sektor Jasa-Jasa',
        targetVolume: 1,
        unit: 'Laporan Publikasi',
        evidence: 'https://drive.google.com/drive/folders/neraca-sigi-jasa2026',
        tags: ['3'], // tagged Rian
        dateSubmitted: '2026-07-10',
        status: 'pending',
        evaluations: null
    },
    {
        id: 'act-4',
        userId: '6', // Eko Prasetyo
        skpId: 'skp-6-1',
        skpTitle: 'Terlaksananya Survei Harga Perdagangan Besar dan Eceran Sektor Jasa 2026',
        name: 'Pencacahan Lapangan Harga Konsumen Komoditas Pokok di Pasar Biromaru Sigi',
        targetVolume: 12,
        unit: 'Daftar Isian',
        evidence: 'https://drive.google.com/drive/folders/surveiharga-biromaru',
        tags: [],
        dateSubmitted: '2026-07-01',
        status: 'evaluated',
        evaluations: {
            kuantitas: 75,
            kualitas: 70,
            waktu: 65,
            average: 70.00,
            predicate: 'Cukup',
            tukinDeduction: 2,
            evaluatorId: '1', // Kepala BPS (Budi Santoso)
            evaluatorName: 'Drs. Budi Santoso, M.Si.',
            dateEvaluated: '2026-07-03',
            feedback: 'Beberapa dokumen survei harga terlambat diserahkan, tolong tingkatkan kedisiplinan pencacahan.'
        }
    }
];

// --- App State Variables ---
let users = [];
let activities = [];
let kipappSKP = {};
let currentUser = null;
let currentView = 'summary';

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initDatabase();
    checkSession();
    setupEventListeners();
});

function initDatabase() {
    if (!localStorage.getItem(STORAGE_KEY_USERS)) {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(defaultUsers));
    }
    if (!localStorage.getItem(STORAGE_KEY_ACTIVITIES)) {
        localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(defaultActivities));
    }
    if (!localStorage.getItem(STORAGE_KEY_KIPAPP)) {
        localStorage.setItem(STORAGE_KEY_KIPAPP, JSON.stringify(defaultKipAppSKP));
    }

    users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS));
    activities = JSON.parse(localStorage.getItem(STORAGE_KEY_ACTIVITIES));
    kipappSKP = JSON.parse(localStorage.getItem(STORAGE_KEY_KIPAPP));
}

function checkSession() {
    const sessionUser = sessionStorage.getItem(SESSION_KEY_ACTIVE_USER);
    if (sessionUser) {
        currentUser = JSON.parse(sessionUser);
        showDashboard();
    } else {
        showLogin();
    }
}

function setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Set current date in navbar
    const dateBadge = document.getElementById('nav-current-date');
    if (dateBadge) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateBadge.innerText = new Date().toLocaleDateString('id-ID', options);
    }
}

// ==========================================================================
// AUTHENTICATION LOGIC
// ==========================================================================
function handleLogin(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('login-error');

    const user = users.find(u => u.username.toLowerCase() === usernameInput.toLowerCase() && u.password === passwordInput);

    if (user) {
        errorMsg.classList.add('hidden');
        currentUser = user;
        sessionStorage.setItem(SESSION_KEY_ACTIVE_USER, JSON.stringify(user));
        showDashboard();
        // Reset form inputs
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    } else {
        errorMsg.classList.remove('hidden');
    }
}

function quickLogin(roleName) {
    let user;
    if (roleName === 'kepala') user = users.find(u => u.username === 'kepala');
    else if (roleName === 'ketuatim') user = users.find(u => u.username === 'ketuatim');
    else if (roleName === 'pegawai') user = users.find(u => u.username === 'pegawai');
    else if (roleName === 'sekretaris') user = users.find(u => u.username === 'sekretaris');
    else if (roleName === 'admin') user = users.find(u => u.username === 'admin');

    if (user) {
        currentUser = user;
        sessionStorage.setItem(SESSION_KEY_ACTIVE_USER, JSON.stringify(user));
        showDashboard();
    }
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem(SESSION_KEY_ACTIVE_USER);
    showLogin();
}

function showLogin() {
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('dashboard-page').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('dashboard-page').classList.remove('hidden');

    // Update Nav User Panel
    document.getElementById('nav-user-name').innerText = currentUser.name;
    
    let displayRole = currentUser.role.toUpperCase();
    if (currentUser.role === 'pegawai') {
        displayRole = currentUser.type === 'ketua_tim' ? 'PEGAWAI (KETUA TIM)' : 'PEGAWAI (ANGGOTA)';
    }
    document.getElementById('nav-user-role').innerText = displayRole;

    // Set Avatar Letter
    document.getElementById('nav-avatar').innerText = currentUser.name.charAt(0).toUpperCase();

    // Render Role-based Sidebar Menus
    renderSidebarMenu();

    // Reset view to Summary
    switchView('summary');
}

// ==========================================================================
// NAVIGATION & SIDEBAR RENDER
// ==========================================================================
function renderSidebarMenu() {
    const nav = document.getElementById('sidebar-nav');
    nav.innerHTML = '';

    const menuItems = [
        { id: 'summary', title: 'Ringkasan Dasbor', roles: ['admin', 'kepala', 'pegawai', 'sekretaris'], icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>` }
    ];

    if (currentUser.role === 'admin') {
        menuItems.push(
            { id: 'admin-users', title: 'Kelola Pengguna', roles: ['admin'], icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
            { id: 'admin-settings', title: 'Pengaturan Sistem', roles: ['admin'], icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>` }
        );
    } else if (currentUser.role === 'pegawai') {
        menuItems.push(
            { id: 'pegawai-skp', title: 'Target SKP Tahunan', roles: ['pegawai'], icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>` },
            { id: 'pegawai-kegiatan', title: 'Kegiatan Bulanan', roles: ['pegawai'], icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>` }
        );
    } else if (currentUser.role === 'kepala') {
        menuItems.push(
            { id: 'kepala-eval', title: 'Evaluasi Pegawai', roles: ['kepala'], icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="10" y2="16"/><line x1="15" y1="10" x2="15" y2="10"/><path d="M12 11l-3 3 1.5 1.5"/></svg>` }
        );
    } else if (currentUser.role === 'sekretaris') {
        menuItems.push(
            { id: 'sekretaris-rekap', title: 'Rekapitulasi Tukin', roles: ['sekretaris'], icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>` }
        );
    }

    // Dynamic Team Leader Evaluation Access
    if (currentUser.role === 'pegawai' && currentUser.type === 'ketua_tim') {
        menuItems.push(
            { id: 'ketua-eval', title: 'Evaluasi Anggota Tim', roles: ['pegawai'], icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` }
        );
    }

    menuItems.forEach(item => {
        const div = document.createElement('div');
        div.className = `menu-item ${item.id === currentView ? 'active' : ''}`;
        div.id = `menu-${item.id}`;
        div.innerHTML = `${item.icon} <span>${item.title}</span>`;
        div.onclick = () => switchView(item.id);
        nav.appendChild(div);
    });
}

function switchView(viewId) {
    currentView = viewId;
    
    // Manage sidebar active styles
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    const activeMenu = document.getElementById(`menu-${viewId}`);
    if (activeMenu) activeMenu.classList.add('active');

    // Update Topbar Title
    const titleMap = {
        'summary': 'Ringkasan Dasbor',
        'admin-users': 'Kelola Pengguna Sistem',
        'admin-settings': 'Pengaturan Data & Sistem',
        'pegawai-skp': 'Daftar Rencana Kinerja (SKP) Tahunan',
        'pegawai-kegiatan': 'Kelola Kegiatan Bulanan & Bukti Dukung',
        'kepala-eval': 'Evaluasi Kinerja Pegawai',
        'ketua-eval': 'Evaluasi Kinerja Anggota Tim',
        'sekretaris-rekap': 'Rekapitulasi Kinerja & Tukin Pegawai'
    };
    document.getElementById('page-title').innerText = titleMap[viewId] || 'Dasbor';

    // Close mobile menu if active
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    }

    // Render respective content
    renderViewContent(viewId);
}

function toggleSidebar() {
    let sidebar = document.querySelector('.sidebar');
    let overlay = document.querySelector('.sidebar-overlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.onclick = toggleSidebar;
        document.body.appendChild(overlay);
    }

    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// ==========================================================================
// VIEWS RENDER ROUTING
// ==========================================================================
function renderViewContent(viewId) {
    const container = document.getElementById('view-container');
    
    // Fetch latest storage values
    initDatabase();

    switch (viewId) {
        case 'summary':
            renderSummaryView(container);
            break;
        case 'admin-users':
            renderAdminUsersView(container);
            break;
        case 'admin-settings':
            renderAdminSettingsView(container);
            break;
        case 'pegawai-skp':
            renderPegawaiSKPView(container);
            break;
        case 'pegawai-kegiatan':
            renderPegawaiKegiatanView(container);
            break;
        case 'kepala-eval':
        case 'ketua-eval':
            renderEvaluatorView(container, viewId === 'ketua-eval');
            break;
        case 'sekretaris-rekap':
            renderSekretarisRekapView(container);
            break;
        default:
            container.innerHTML = `<h3>View ${viewId} tidak ditemukan.</h3>`;
    }
}

// ==========================================================================
// 1. VIEW: SUMMARY (DASHBOARD HIGHLIGHTS)
// ==========================================================================
function renderSummaryView(container) {
    let statsHTML = '';
    let welcomeText = '';
    let descriptionText = '';

    if (currentUser.role === 'admin') {
        welcomeText = 'Halo, Admin SI-BUDI!';
        descriptionText = 'Gunakan dasbor ini untuk mengelola data akun pengguna, dan mereset basis data simulasi.';
        const activeUsersCount = users.length;
        const totalActivitiesCount = activities.length;
        const evaluatedActivitiesCount = activities.filter(a => a.status === 'evaluated').length;

        statsHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-card-left">
                        <span class="stat-label">Total Pengguna</span>
                        <span class="stat-value">${activeUsersCount}</span>
                        <span class="stat-desc">Akun terdaftar</span>
                    </div>
                    <div class="stat-icon-wrapper stat-primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-left">
                        <span class="stat-label">Total Kegiatan</span>
                        <span class="stat-value">${totalActivitiesCount}</span>
                        <span class="stat-desc">Dilaporkan pegawai</span>
                    </div>
                    <div class="stat-icon-wrapper stat-teal">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-left">
                        <span class="stat-label">Sudah Dinilai</span>
                        <span class="stat-value">${evaluatedActivitiesCount}</span>
                        <span class="stat-desc">Oleh evaluator</span>
                    </div>
                    <div class="stat-icon-wrapper stat-amber">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                </div>
            </div>
        `;
    } else if (currentUser.role === 'pegawai') {
        const typeLabel = currentUser.type === 'ketua_tim' ? 'Ketua Tim' : 'Anggota Tim';
        welcomeText = `Selamat Datang, ${currentUser.name}!`;
        descriptionText = `Tipe Akun: <strong>${typeLabel}</strong>. Kelola butir SKP Tahunan Anda dari KipAPP dan laporkan bukti dukung kegiatan bulanan tepat waktu.`;

        // Pegawai statistics
        const myActs = activities.filter(a => a.userId === currentUser.id);
        const mySKPCount = kipappSKP[currentUser.id] ? kipappSKP[currentUser.id].length : 0;
        const pendingActs = myActs.filter(a => a.status === 'pending').length;
        const evaluatedActs = myActs.filter(a => a.status === 'evaluated');
        
        let avgScore = 0;
        let avgDeduction = 0;
        if (evaluatedActs.length > 0) {
            const sum = evaluatedActs.reduce((acc, act) => acc + act.evaluations.average, 0);
            avgScore = (sum / evaluatedActs.length).toFixed(2);
            avgDeduction = evaluatedActs.reduce((acc, act) => acc + act.evaluations.tukinDeduction, 0);
        } else {
            avgScore = '100.00 (Default)';
        }

        statsHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-card-left">
                        <span class="stat-label">SKP Tahunan Aktif</span>
                        <span class="stat-value">${mySKPCount}</span>
                        <span class="stat-desc">Disinkronkan dari KipAPP</span>
                    </div>
                    <div class="stat-icon-wrapper stat-primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-left">
                        <span class="stat-label">Laporan Bulanan</span>
                        <span class="stat-value">${myActs.length}</span>
                        <span class="stat-desc">${pendingActs} menunggu dinilai</span>
                    </div>
                    <div class="stat-icon-wrapper stat-teal">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-left">
                        <span class="stat-label">Rata-rata Nilai</span>
                        <span class="stat-value">${avgScore}</span>
                        <span class="stat-desc">Skala 0-100</span>
                    </div>
                    <div class="stat-icon-wrapper stat-amber">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-left">
                        <span class="stat-label">Akumulasi Potongan Tukin</span>
                        <span class="stat-value text-red">${avgDeduction}%</span>
                        <span class="stat-desc">Berdasarkan penilaian</span>
                    </div>
                    <div class="stat-icon-wrapper stat-purple">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                </div>
            </div>
        `;
    } else if (currentUser.role === 'kepala') {
        welcomeText = `Selamat Datang, ${currentUser.name}!`;
        descriptionText = `Jabatan: <strong>Kepala BPS Kabupaten Sigi</strong>. Evaluasi kinerja bulanan Ketua Tim dan Anggota Tim berdasarkan bukti dukung kegiatan mereka.`;
        
        const totalPegawaiCount = users.filter(u => u.role === 'pegawai').length;
        const totalPendingEvaluations = activities.filter(a => a.status === 'pending').length;
        
        statsHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-card-left">
                        <span class="stat-label">Total Pegawai Supervisi</span>
                        <span class="stat-value">${totalPegawaiCount}</span>
                        <span class="stat-desc">Ketua Tim & Anggota</span>
                    </div>
                    <div class="stat-icon-wrapper stat-primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-left">
                        <span class="stat-label">Belum Dinilai</span>
                        <span class="stat-value text-amber">${totalPendingEvaluations}</span>
                        <span class="stat-desc">Kegiatan menunggu evaluasi</span>
                    </div>
                    <div class="stat-icon-wrapper stat-amber">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                </div>
            </div>
        `;
    } else if (currentUser.role === 'sekretaris') {
        welcomeText = `Selamat Datang, ${currentUser.name}!`;
        descriptionText = `Peran: <strong>Staf Kepegawaian & Rekapitulasi Tukin</strong>. Pantau hasil penilaian pegawai dan lakukan rekapitulasi data Tunjangan Kinerja bulanan.`;
        
        const totalPegawaiCount = users.filter(u => u.role === 'pegawai').length;
        const evaluatedCount = activities.filter(a => a.status === 'evaluated').length;

        statsHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-card-left">
                        <span class="stat-label">Total Pegawai</span>
                        <span class="stat-value">${totalPegawaiCount}</span>
                        <span class="stat-desc">BPS Kabupaten Sigi</span>
                    </div>
                    <div class="stat-icon-wrapper stat-primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-left">
                        <span class="stat-label">Kegiatan Dinilai</span>
                        <span class="stat-value text-teal">${evaluatedCount}</span>
                        <span class="stat-desc">Dari seluruh kegiatan</span>
                    </div>
                    <div class="stat-icon-wrapper stat-teal">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                </div>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="action-banner">
            <div class="banner-content">
                <h3>${welcomeText}</h3>
                <p>${descriptionText}</p>
            </div>
            <div class="banner-actions">
                ${currentUser.role === 'pegawai' ? '<button class="btn btn-secondary" onclick="switchView(\'pegawai-kegiatan\')">Input Kegiatan Baru</button>' : ''}
                ${currentUser.role === 'kepala' ? '<button class="btn btn-secondary" onclick="switchView(\'kepala-eval\')">Mulai Menilai</button>' : ''}
                ${currentUser.role === 'sekretaris' ? '<button class="btn btn-secondary" onclick="switchView(\'sekretaris-rekap\')">Buka Rekapitulasi</button>' : ''}
            </div>
        </div>

        ${statsHTML}

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Aktivitas & Kinerja Terbaru</h3>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Pegawai</th>
                                <th>Deskripsi Kegiatan</th>
                                <th>Target</th>
                                <th>Tanggal Lapor</th>
                                <th>Status</th>
                                <th>Nilai Akhir</th>
                                <th>Potongan Tukin</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${getRecentActivitiesHTML()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function getRecentActivitiesHTML() {
    let list = [...activities];
    
    // Sort by date submitted descending
    list.sort((a,b) => new Date(b.dateSubmitted) - new Date(a.dateSubmitted));
    
    // Filter by user if role is Pegawai
    if (currentUser.role === 'pegawai') {
        list = list.filter(a => a.userId === currentUser.id);
    }
    
    // Take top 5
    list = list.slice(0, 5);

    if (list.length === 0) {
        return `<tr><td colspan="7" class="text-center">Belum ada aktivitas kegiatan terekam.</td></tr>`;
    }

    return list.map(act => {
        const emp = users.find(u => u.id === act.userId);
        const empName = emp ? emp.name : 'Unknown';
        
        let statusBadge = `<span class="status-badge badge-warning">Menunggu</span>`;
        let scoreVal = '-';
        let tukinVal = '-';

        if (act.status === 'evaluated') {
            statusBadge = `<span class="status-badge badge-success">Dinilai</span>`;
            scoreVal = act.evaluations.average.toFixed(2);
            tukinVal = act.evaluations.tukinDeduction > 0 ? `<span class="text-red">${act.evaluations.tukinDeduction}%</span>` : `<span class="text-green">0%</span>`;
        }

        return `
            <tr>
                <td class="text-bold">${empName}</td>
                <td>${act.name}</td>
                <td>${act.targetVolume} ${act.unit}</td>
                <td>${formatDate(act.dateSubmitted)}</td>
                <td>${statusBadge}</td>
                <td class="text-bold">${scoreVal}</td>
                <td class="text-bold">${tukinVal}</td>
            </tr>
        `;
    }).join('');
}

// ==========================================================================
// 2. VIEW: PEGAWAI - TARGET SKP TAHUNAN & KIPAPP SYNC
// ==========================================================================
function renderPegawaiSKPView(container) {
    const mySKP = kipappSKP[currentUser.id] || [];

    container.innerHTML = `
        <div class="action-banner">
            <div class="banner-content">
                <h3>Integrasi API KipAPP</h3>
                <p>Data Rencana Kinerja (SKP) Tahunan disinkronkan secara terpadu dari sistem KipAPP BPS RI untuk menjamin keselarasan kinerja tahunan dan bulanan.</p>
            </div>
            <div class="banner-actions">
                <button class="btn btn-secondary" onclick="openKipAppSyncModal()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                    <span>Sinkronisasi KipAPP</span>
                </button>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Rencana Kinerja Tahunan Aktif</h3>
                <span class="status-badge badge-info">${mySKP.length} SKP Terdaftar</span>
            </div>
            <div class="card-body">
                ${mySKP.length === 0 ? `
                    <div class="text-center" style="padding: 40px 0;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;color:var(--slate-400);margin-bottom:12px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <p style="color:var(--slate-600);font-weight:600;margin-bottom:8px;">Belum ada SKP Tahunan disinkronkan</p>
                        <p style="color:var(--slate-400);font-size:13px;margin-bottom:16px;">Silakan lakukan sinkronisasi untuk menarik data rencana kinerja Anda dari KipAPP BPS.</p>
                        <button class="btn btn-primary btn-sm" onclick="openKipAppSyncModal()">Mulai Sinkronisasi</button>
                    </div>
                ` : `
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th style="width: 80px;">No.</th>
                                    <th>Target Rencana Kinerja (SKP) Tahunan</th>
                                    <th>Sumber Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${mySKP.map((skp, idx) => `
                                    <tr>
                                        <td>${idx + 1}</td>
                                        <td class="text-bold">${skp.title}</td>
                                        <td><span class="status-badge badge-success">API KipAPP</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        </div>
    `;
}

function openKipAppSyncModal() {
    const modal = document.getElementById('modal-sync');
    const progressBar = document.getElementById('sync-progress-bar');
    const statusText = document.getElementById('sync-status-text');
    const logArea = document.getElementById('sync-log-area');
    const btnCancel = document.getElementById('btn-cancel-sync');
    const btnFinish = document.getElementById('btn-finish-sync');
    const spinner = document.getElementById('sync-spinner');

    progressBar.style.width = '0%';
    statusText.innerText = 'Membangun koneksi dengan REST API KipAPP...';
    logArea.innerHTML = '<div class="log-entry log-info">[info] Menghubungi endpoint https://kipapp.bps.go.id/api/v2/skp-tahunan...</div>';
    btnCancel.classList.remove('hidden');
    btnFinish.classList.add('hidden');
    spinner.style.animationPlayState = 'running';

    modal.classList.add('active');

    // Sync Progress simulation
    let progress = 0;
    const logs = [
        { progress: 15, text: '[v] Koneksi berhasil terjalin. Mengotentikasi kredensial NIP...', type: 'info' },
        { progress: 30, text: `[v] NIP Terverifikasi: ${currentUser.nip}`, type: 'success' },
        { progress: 45, text: '[info] Mengunduh butir-butir Rencana Kinerja Tahunan 2026...', type: 'info' },
        { progress: 65, text: '[v] Berhasil memetakan 3 butir Rencana Kinerja utama.', type: 'success' },
        { progress: 85, text: '[info] Mengintegrasikan target ke database local SI-BUDI...', type: 'info' },
        { progress: 100, text: '[v] Sinkronisasi data KipAPP SELESAI!', type: 'success' }
    ];

    let logIdx = 0;
    const syncInterval = setInterval(() => {
        progress += 5;
        progressBar.style.width = `${progress}%`;

        // Check if logs should be appended
        if (logIdx < logs.length && progress >= logs[logIdx].progress) {
            const entry = logs[logIdx];
            const logDiv = document.createElement('div');
            logDiv.className = `log-entry ${entry.type === 'success' ? 'log-success' : 'log-info'}`;
            logDiv.innerText = entry.text;
            logArea.appendChild(logDiv);
            logArea.scrollTop = logArea.scrollHeight;
            statusText.innerText = entry.text;
            logIdx++;
        }

        if (progress >= 100) {
            clearInterval(syncInterval);
            spinner.style.animationPlayState = 'paused';
            statusText.innerText = 'Sinkronisasi Berhasil!';
            btnCancel.classList.add('hidden');
            btnFinish.classList.remove('hidden');

            // Apply modifications to LocalStorage KipAPP for this user if not exist
            if (!kipappSKP[currentUser.id] || kipappSKP[currentUser.id].length === 0) {
                // Populate default KipAPP data for user
                const mockSKPs = [
                    { id: `skp-${currentUser.id}-1`, title: 'Terlaksananya kegiatan pengumpulan data lapangan statistik sektoral' },
                    { id: `skp-${currentUser.id}-2`, title: 'Tersedianya berkas laporan administrasi kegiatan bulanan secara berkala' },
                    { id: `skp-${currentUser.id}-3`, title: 'Meningkatnya kepatuhan pelaporan kinerja unit kerja Kabupaten Sigi' }
                ];
                kipappSKP[currentUser.id] = mockSKPs;
                localStorage.setItem(STORAGE_KEY_KIPAPP, JSON.stringify(kipappSKP));
            }
            
            // Auto reload background data
            renderViewContent(currentView);
            renderSidebarMenu();
        }
    }, 150);
}

// ==========================================================================
// 3. VIEW: PEGAWAI - KEGIATAN BULANAN CRUD
// ==========================================================================
function renderPegawaiKegiatanView(container) {
    const myActs = activities.filter(a => a.userId === currentUser.id);
    const mySKP = kipappSKP[currentUser.id] || [];

    let addBtnHTML = '';
    if (mySKP.length === 0) {
        addBtnHTML = `
            <button class="btn btn-primary" onclick="switchView('pegawai-skp')" title="Sinkronisasikan SKP Tahunan Anda terlebih dahulu">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>Sinkronisasi SKP Dulu</span>
            </button>
        `;
    } else {
        addBtnHTML = `
            <button class="btn btn-primary" onclick="openActivityModal()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>Tambah Kegiatan</span>
            </button>
        `;
    }

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Daftar Kegiatan Bulanan Anda</h3>
                <div class="card-header-actions">
                    ${addBtnHTML}
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Target SKP Tahunan</th>
                                <th>Kegiatan Bulanan</th>
                                <th>Target Vol</th>
                                <th>Bukti Dukung</th>
                                <th>Rekan Ditag</th>
                                <th>Status</th>
                                <th>Nilai Akhir</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${myActs.length === 0 ? `<tr><td colspan="8" class="text-center">Belum ada kegiatan bulanan dilaporkan. Silakan klik Tambah Kegiatan.</td></tr>` : 
                                myActs.map(act => {
                                    let statusBadge = `<span class="status-badge badge-warning">Menunggu Penilaian</span>`;
                                    let scoreHTML = '-';
                                    let actionsHTML = `
                                        <div class="cell-actions">
                                            <button class="btn-icon" onclick="openActivityModal('${act.id}')" title="Edit Kegiatan">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                            </button>
                                            <button class="btn-icon btn-icon-danger" onclick="deleteActivity('${act.id}')" title="Hapus Kegiatan">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                            </button>
                                        </div>
                                    `;

                                    if (act.status === 'evaluated') {
                                        statusBadge = `<span class="status-badge badge-success" title="Dinilai oleh ${act.evaluations.evaluatorName}">Dinilai</span>`;
                                        scoreHTML = `<span class="text-bold" title="Kuantitas: ${act.evaluations.kuantitas}, Kualitas: ${act.evaluations.kualitas}, Waktu: ${act.evaluations.waktu}">${act.evaluations.average.toFixed(2)}</span>`;
                                        actionsHTML = `
                                            <button class="btn btn-secondary btn-sm" onclick="viewEvaluationDetails('${act.id}')">
                                                Detail Nilai
                                            </button>
                                        `;
                                    }

                                    // Map peer tags to names
                                    const taggedNames = act.tags.map(tagId => {
                                        const peer = users.find(u => u.id === tagId);
                                        return peer ? peer.name.split(',')[0] : 'Unknown';
                                    });
                                    const tagsHTML = taggedNames.length > 0 ? 
                                        `<div class="tag-container">${taggedNames.map(name => `<span class="tag-badge">${name}</span>`).join('')}</div>` : 
                                        '<span style="color:var(--slate-400);">Tidak ada</span>';

                                    return `
                                        <tr>
                                            <td style="max-width: 200px; font-size:12.5px;" class="text-bold">${act.skpTitle}</td>
                                            <td style="max-width: 250px;">${act.name}</td>
                                            <td>${act.targetVolume} ${act.unit}</td>
                                            <td>
                                                <a href="${act.evidence}" target="_blank" class="link-evidence">
                                                    <span>Buka Berkas</span>
                                                </a>
                                            </td>
                                            <td>${tagsHTML}</td>
                                            <td>${statusBadge}</td>
                                            <td>${scoreHTML}</td>
                                            <td>${actionsHTML}</td>
                                        </tr>
                                    `;
                                }).join('')
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function openActivityModal(actId = '') {
    const modal = document.getElementById('modal-activity');
    const form = document.getElementById('activity-form');
    const title = document.getElementById('activity-modal-title');
    
    // Reset form
    form.reset();
    document.getElementById('edit-activity-id').value = '';

    // Populate SKP Tahunan dropdown for current user
    const selectSKP = document.getElementById('act-skp');
    selectSKP.innerHTML = '<option value="">-- Pilih Rencana Kinerja Tahunan --</option>';
    const mySKPs = kipappSKP[currentUser.id] || [];
    mySKPs.forEach(skp => {
        const opt = document.createElement('option');
        opt.value = skp.id;
        opt.innerText = skp.title;
        selectSKP.appendChild(opt);
    });

    // Populate Tags multi-select (all other pegawai users)
    const selectTags = document.getElementById('act-tags');
    selectTags.innerHTML = '';
    const otherPegawai = users.filter(u => u.role === 'pegawai' && u.id !== currentUser.id);
    otherPegawai.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.innerText = `${p.name} (${p.type === 'ketua_tim' ? 'Ketua Tim' : 'Anggota'})`;
        selectTags.appendChild(opt);
    });

    if (actId) {
        // Edit Mode
        title.innerText = 'Edit Kegiatan Bulanan';
        const act = activities.find(a => a.id === actId);
        if (act) {
            document.getElementById('edit-activity-id').value = act.id;
            document.getElementById('act-skp').value = act.skpId;
            document.getElementById('act-name').value = act.name;
            document.getElementById('act-target').value = act.targetVolume;
            document.getElementById('act-unit').value = act.unit;
            document.getElementById('act-evidence').value = act.evidence;
            
            // Set multi-select tags
            Array.from(selectTags.options).forEach(opt => {
                if (act.tags.includes(opt.value)) {
                    opt.selected = true;
                }
            });
        }
    } else {
        // Add Mode
        title.innerText = 'Tambah Kegiatan Bulanan';
    }

    modal.classList.add('active');
}

function saveActivity(e) {
    e.preventDefault();
    const actId = document.getElementById('edit-activity-id').value;
    const skpId = document.getElementById('act-skp').value;
    const name = document.getElementById('act-name').value.trim();
    const targetVolume = parseInt(document.getElementById('act-target').value);
    const unit = document.getElementById('act-unit').value.trim();
    const evidence = document.getElementById('act-evidence').value.trim();
    
    // Multi-select tags retrieval
    const selectTags = document.getElementById('act-tags');
    const tags = Array.from(selectTags.selectedOptions).map(opt => opt.value);

    const skpObj = (kipappSKP[currentUser.id] || []).find(s => s.id === skpId);
    const skpTitle = skpObj ? skpObj.title : 'SKP Tahunan';

    if (actId) {
        // Update existing activity
        const idx = activities.findIndex(a => a.id === actId);
        if (idx !== -1) {
            // Retain evaluations if any
            activities[idx] = {
                ...activities[idx],
                skpId,
                skpTitle,
                name,
                targetVolume,
                unit,
                evidence,
                tags
            };
        }
    } else {
        // Create new activity
        const newAct = {
            id: 'act-' + Date.now(),
            userId: currentUser.id,
            skpId,
            skpTitle,
            name,
            targetVolume,
            unit,
            evidence,
            tags,
            dateSubmitted: new Date().toISOString().split('T')[0], // yyyy-mm-dd
            status: 'pending',
            evaluations: null
        };
        activities.push(newAct);
    }

    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
    closeModal('modal-activity');
    renderViewContent(currentView);
}

function deleteActivity(actId) {
    if (confirm('Apakah Anda yakin ingin menghapus laporan kegiatan bulanan ini?')) {
        activities = activities.filter(a => a.id !== actId);
        localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
        renderViewContent(currentView);
    }
}

function viewEvaluationDetails(actId) {
    const act = activities.find(a => a.id === actId);
    if (!act || act.status !== 'evaluated') return;

    const evalData = act.evaluations;
    alert(`=== DETAIL PENILAIAN KINERJA ===
Pegawai: ${currentUser.name}
Kegiatan: ${act.name}
Evaluator: ${evalData.evaluatorName}
Tanggal Dinilai: ${formatDate(evalData.dateEvaluated)}

--- Aspek Penilaian ---
1. Kuantitas: ${evalData.kuantitas}
2. Kualitas: ${evalData.kualitas}
3. Ketepatan Waktu: ${evalData.waktu}

Rata-rata Nilai Akhir: ${evalData.average.toFixed(2)}
Predikat: ${evalData.predicate}
Potongan Tukin: ${evalData.tukinDeduction}%

--- Catatan Evaluasi ---
"${evalData.feedback || 'Tidak ada catatan khusus.'}"`);
}

// ==========================================================================
// 4. VIEW: KEPALA BPS & KETUA TIM - EVALUASI PEGAWAI
// ==========================================================================
function renderEvaluatorView(container, isKetuaTimView = false) {
    // Determine evaluatees
    // Kepala BPS can evaluate all pegawai (except themselves, which is not a pegawai anyway)
    // Ketua Tim can only evaluate pegawai of type 'anggota'
    let evaluateeIds = [];
    if (isKetuaTimView) {
        evaluateeIds = users.filter(u => u.role === 'pegawai' && u.type === 'anggota').map(u => u.id);
    } else {
        evaluateeIds = users.filter(u => u.role === 'pegawai' && u.id !== currentUser.id).map(u => u.id);
    }

    const evalActs = activities.filter(a => evaluateeIds.includes(a.userId));

    // Split into pending and evaluated
    const pendingList = evalActs.filter(a => a.status === 'pending');
    const evaluatedList = evalActs.filter(a => a.status === 'evaluated');

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Kegiatan Menunggu Penilaian (${pendingList.length})</h3>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Pegawai</th>
                                <th>Induk SKP Tahunan</th>
                                <th>Kegiatan Bulanan</th>
                                <th>Target</th>
                                <th>Tgl Lapor</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pendingList.length === 0 ? `<tr><td colspan="6" class="text-center">Hebat! Semua berkas kegiatan bulanan pegawai telah dinilai.</td></tr>` : 
                                pendingList.map(act => {
                                    const emp = users.find(u => u.id === act.userId);
                                    const empName = emp ? `${emp.name} (${emp.type === 'ketua_tim' ? 'Ketua Tim' : 'Anggota'})` : 'Pegawai';
                                    return `
                                        <tr>
                                            <td class="text-bold">${empName}</td>
                                            <td style="font-size:12px; max-width:200px;">${act.skpTitle}</td>
                                            <td style="max-width:250px;">${act.name}</td>
                                            <td>${act.targetVolume} ${act.unit}</td>
                                            <td>${formatDate(act.dateSubmitted)}</td>
                                            <td>
                                                <button class="btn btn-primary btn-sm" onclick="openEvaluationModal('${act.id}')">
                                                    Evaluasi
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Kegiatan Telah Dinilai (${evaluatedList.length})</h3>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Pegawai</th>
                                <th>Kegiatan Bulanan</th>
                                <th>Nilai Kinerja</th>
                                <th>Potongan Tukin</th>
                                <th>Evaluator</th>
                                <th>Tanggal Dinilai</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${evaluatedList.length === 0 ? `<tr><td colspan="7" class="text-center">Belum ada kegiatan yang dinilai pada database.</td></tr>` : 
                                evaluatedList.map(act => {
                                    const emp = users.find(u => u.id === act.userId);
                                    const empName = emp ? emp.name : 'Pegawai';
                                    
                                    const score = act.evaluations.average.toFixed(2);
                                    const tukinText = act.evaluations.tukinDeduction > 0 ? 
                                        `<span class="status-badge badge-danger">${act.evaluations.tukinDeduction}% Potong</span>` : 
                                        `<span class="status-badge badge-success">0%</span>`;

                                    return `
                                        <tr>
                                            <td class="text-bold">${empName}</td>
                                            <td>${act.name}</td>
                                            <td class="text-bold">${score} (${act.evaluations.predicate})</td>
                                            <td>${tukinText}</td>
                                            <td>${act.evaluations.evaluatorName}</td>
                                            <td>${formatDate(act.evaluations.dateEvaluated)}</td>
                                            <td>
                                                <button class="btn btn-secondary btn-sm" onclick="openEvaluationModal('${act.id}')">
                                                    Re-Evaluasi
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function openEvaluationModal(actId) {
    const modal = document.getElementById('modal-eval');
    const act = activities.find(a => a.id === actId);
    if (!act) return;

    const emp = users.find(u => u.id === act.userId);
    const empName = emp ? `${emp.name} (${emp.type === 'ketua_tim' ? 'Ketua Tim' : 'Anggota'})` : 'Pegawai';

    // Populate static fields
    document.getElementById('eval-activity-id').value = act.id;
    document.getElementById('eval-show-pegawai').innerText = empName;
    document.getElementById('eval-show-skp').innerText = act.skpTitle;
    document.getElementById('eval-show-act').innerText = act.name;
    document.getElementById('eval-show-target').innerText = `${act.targetVolume} ${act.unit}`;
    
    const evidenceLink = document.getElementById('eval-show-evidence');
    evidenceLink.href = act.evidence;
    evidenceLink.querySelector('span').innerText = act.evidence.length > 30 ? act.evidence.substring(0, 30) + '...' : act.evidence;

    // Tagged users
    const tagNames = act.tags.map(tid => {
        const u = users.find(x => x.id === tid);
        return u ? u.name : 'Unknown';
    });
    document.getElementById('eval-show-tags').innerText = tagNames.length > 0 ? tagNames.join(', ') : 'Tidak ada';

    // Reset or load initial values
    if (act.status === 'evaluated') {
        const ev = act.evaluations;
        document.getElementById('val-kuantitas').value = ev.kuantitas;
        document.getElementById('val-kuantitas-num').value = ev.kuantitas;
        document.getElementById('val-kualitas').value = ev.kualitas;
        document.getElementById('val-kualitas-num').value = ev.kualitas;
        document.getElementById('val-waktu').value = ev.waktu;
        document.getElementById('val-waktu-num').value = ev.waktu;
        document.getElementById('eval-feedback').value = ev.feedback || '';
    } else {
        document.getElementById('val-kuantitas').value = 100;
        document.getElementById('val-kuantitas-num').value = 100;
        document.getElementById('val-kualitas').value = 100;
        document.getElementById('val-kualitas-num').value = 100;
        document.getElementById('val-waktu').value = 100;
        document.getElementById('val-waktu-num').value = 100;
        document.getElementById('eval-feedback').value = '';
    }

    calculateLiveEvaluation();
    modal.classList.add('active');
}

// Live feedback in Modal Evaluation
function syncRangeValue(sliderId, value) {
    const val = Math.max(0, Math.min(100, parseInt(value) || 0));
    document.getElementById(sliderId).value = val;
    calculateLiveEvaluation();
}

function syncNumValue(numInputId, value) {
    document.getElementById(numInputId).value = value;
    calculateLiveEvaluation();
}

function calculateLiveEvaluation() {
    const kuantitas = parseInt(document.getElementById('val-kuantitas').value) || 0;
    const kualitas = parseInt(document.getElementById('val-kualitas').value) || 0;
    const waktu = parseInt(document.getElementById('val-waktu').value) || 0;

    const average = (kuantitas + kualitas + waktu) / 3;
    document.getElementById('eval-calc-average').innerText = average.toFixed(2);

    // Predicate
    let predicate = 'Sangat Baik';
    let predClass = 'pred-sangat-baik';
    let tukinDeduction = 0;

    if (average >= 95) {
        predicate = 'Sangat Baik';
        predClass = 'pred-sangat-baik';
        tukinDeduction = 0;
    } else if (average >= 80) {
        predicate = 'Baik';
        predClass = 'pred-baik';
        tukinDeduction = 0;
    } else if (average >= 70) {
        predicate = 'Cukup';
        predClass = 'pred-cukup';
        tukinDeduction = 2; // 2% Tukin deduction
    } else if (average >= 60) {
        predicate = 'Kurang';
        predClass = 'pred-kurang';
        tukinDeduction = 5; // 5% Tukin deduction
    } else {
        predicate = 'Sangat Kurang';
        predClass = 'pred-kurang';
        tukinDeduction = 10; // 10% Tukin deduction
    }

    const predBadge = document.getElementById('eval-calc-predicate');
    predBadge.innerText = predicate;
    predBadge.className = `calc-badge ${predClass}`;

    const tukinText = document.getElementById('eval-calc-tukin');
    tukinText.innerText = `${tukinDeduction}%`;
    if (tukinDeduction > 0) {
        tukinText.className = 'calc-tukin text-red';
    } else {
        tukinText.className = 'calc-tukin text-green';
    }
}

function saveEvaluation(e) {
    e.preventDefault();
    const actId = document.getElementById('eval-activity-id').value;
    const kuantitas = parseInt(document.getElementById('val-kuantitas').value) || 0;
    const kualitas = parseInt(document.getElementById('val-kualitas').value) || 0;
    const waktu = parseInt(document.getElementById('val-waktu').value) || 0;
    const feedback = document.getElementById('eval-feedback').value.trim();

    const average = (kuantitas + kualitas + waktu) / 3;
    
    let predicate = 'Sangat Baik';
    let tukinDeduction = 0;
    if (average >= 95) { predicate = 'Sangat Baik'; tukinDeduction = 0; }
    else if (average >= 80) { predicate = 'Baik'; tukinDeduction = 0; }
    else if (average >= 70) { predicate = 'Cukup'; tukinDeduction = 2; }
    else if (average >= 60) { predicate = 'Kurang'; tukinDeduction = 5; }
    else { predicate = 'Sangat Kurang'; tukinDeduction = 10; }

    const idx = activities.findIndex(a => a.id === actId);
    if (idx !== -1) {
        activities[idx].status = 'evaluated';
        activities[idx].evaluations = {
            kuantitas,
            kualitas,
            waktu,
            average,
            predicate,
            tukinDeduction,
            evaluatorId: currentUser.id,
            evaluatorName: currentUser.name,
            dateEvaluated: new Date().toISOString().split('T')[0],
            feedback
        };
        localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
    }

    closeModal('modal-eval');
    renderViewContent(currentView);
}

// ==========================================================================
// 5. VIEW: SEKRETARIS - REKAPITULASI KINERJA & TUKIN
// ==========================================================================
function renderSekretarisRekapView(container) {
    // Generate compilation of performance per employee
    const pegawaiList = users.filter(u => u.role === 'pegawai');

    container.innerHTML = `
        <div class="filter-bar">
            <div class="filter-group">
                <label for="rekap-filter-role">Tipe Pegawai:</label>
                <select id="rekap-filter-role" onchange="filterRekapTable()">
                    <option value="all">Semua Tipe</option>
                    <option value="ketua_tim">Ketua Tim</option>
                    <option value="anggota">Anggota Tim</option>
                </select>
            </div>
            <div class="card-header-actions">
                <button class="btn btn-success btn-sm" onclick="exportRekapCSV()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    <span>Ekspor CSV</span>
                </button>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Rekapitulasi Penilaian Kinerja & Rekomendasi Pemotongan Tukin</h3>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="data-table" id="rekap-table">
                        <thead>
                            <tr>
                                <th>NIP</th>
                                <th>Nama Pegawai</th>
                                <th>Tipe Pegawai</th>
                                <th class="text-center">Jumlah Kegiatan</th>
                                <th class="text-center">Belum Dinilai</th>
                                <th class="text-center">Rata-rata Nilai</th>
                                <th class="text-center">Predikat Rata-rata</th>
                                <th class="text-center">Akumulasi Potongan Tukin</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pegawaiList.map(emp => {
                                const myActs = activities.filter(a => a.userId === emp.id);
                                const pendingActs = myActs.filter(a => a.status === 'pending').length;
                                const evaluatedActs = myActs.filter(a => a.status === 'evaluated');
                                
                                let scoreSum = 0;
                                let tukinDeductionSum = 0;
                                let avgScoreStr = '-';
                                let predStr = 'Default (100)';
                                let predClass = 'badge-info';

                                if (evaluatedActs.length > 0) {
                                    scoreSum = evaluatedActs.reduce((acc, act) => acc + act.evaluations.average, 0);
                                    tukinDeductionSum = evaluatedActs.reduce((acc, act) => acc + act.evaluations.tukinDeduction, 0);
                                    const avgScore = scoreSum / evaluatedActs.length;
                                    avgScoreStr = avgScore.toFixed(2);
                                    
                                    if (avgScore >= 95) { predStr = 'Sangat Baik'; predClass = 'badge-success'; }
                                    else if (avgScore >= 80) { predStr = 'Baik'; predClass = 'badge-info'; }
                                    else if (avgScore >= 70) { predStr = 'Cukup'; predClass = 'badge-warning'; }
                                    else { predStr = 'Kurang'; predClass = 'badge-danger'; }
                                } else {
                                    predStr = 'Memuaskan';
                                    predClass = 'badge-info';
                                }

                                const typeLabel = emp.type === 'ketua_tim' ? 'Ketua Tim' : 'Anggota';
                                const typeClass = emp.type === 'ketua_tim' ? 'badge-role-ketua' : 'badge-role-pegawai';

                                return `
                                    <tr data-type="${emp.type}">
                                        <td style="font-family: monospace;">${emp.nip}</td>
                                        <td class="text-bold">${emp.name}</td>
                                        <td><span class="badge-role ${typeClass}">${typeLabel}</span></td>
                                        <td class="text-center">${myActs.length}</td>
                                        <td class="text-center text-bold ${pendingActs > 0 ? 'text-amber' : ''}">${pendingActs}</td>
                                        <td class="text-center text-bold">${avgScoreStr}</td>
                                        <td class="text-center"><span class="status-badge ${predClass}">${predStr}</span></td>
                                        <td class="text-center text-bold ${tukinDeductionSum > 0 ? 'text-red' : 'text-green'}">${tukinDeductionSum}%</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function filterRekapTable() {
    const filterVal = document.getElementById('rekap-filter-role').value;
    const table = document.getElementById('rekap-table');
    const rows = table.querySelectorAll('tbody tr');

    rows.forEach(row => {
        const rowType = row.getAttribute('data-type');
        if (filterVal === 'all' || rowType === filterVal) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function exportRekapCSV() {
    const pegawaiList = users.filter(u => u.role === 'pegawai');
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Header
    csvContent += 'NIP,Nama Pegawai,Tipe Pegawai,Jumlah Kegiatan,Belum Dinilai,Rata-rata Nilai,Predikat Rata-rata,Akumulasi Potongan Tukin\r\n';

    pegawaiList.forEach(emp => {
        const myActs = activities.filter(a => a.userId === emp.id);
        const pendingActs = myActs.filter(a => a.status === 'pending').length;
        const evaluatedActs = myActs.filter(a => a.status === 'evaluated');
        
        let scoreSum = 0;
        let tukinDeductionSum = 0;
        let avgScoreStr = '-';
        let predStr = 'Default (100)';

        if (evaluatedActs.length > 0) {
            scoreSum = evaluatedActs.reduce((acc, act) => acc + act.evaluations.average, 0);
            tukinDeductionSum = evaluatedActs.reduce((acc, act) => acc + act.evaluations.tukinDeduction, 0);
            const avgScore = scoreSum / evaluatedActs.length;
            avgScoreStr = avgScore.toFixed(2);
            
            if (avgScore >= 95) predStr = 'Sangat Baik';
            else if (avgScore >= 80) predStr = 'Baik';
            else if (avgScore >= 70) predStr = 'Cukup';
            else predStr = 'Kurang';
        }

        const typeLabel = emp.type === 'ketua_tim' ? 'Ketua Tim' : 'Anggota';
        
        csvContent += `"${emp.nip}","${emp.name}","${typeLabel}",${myActs.length},${pendingActs},"${avgScoreStr}","${predStr}","${tukinDeductionSum}%"\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap-tukin-sibudi-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
}

// ==========================================================================
// 6. VIEW: ADMIN - KELOLA PENGGUNA
// ==========================================================================
function renderAdminUsersView(container) {
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Daftar Pengguna Aplikasi</h3>
                <button class="btn btn-primary btn-sm" onclick="openUserModal()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span>Tambah Pengguna</span>
                </button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>NIP</th>
                                <th>Nama Lengkap</th>
                                <th>Username</th>
                                <th>Role Utama</th>
                                <th>Tipe Pegawai</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(u => {
                                let typeLabel = '-';
                                if (u.role === 'pegawai') {
                                    typeLabel = u.type === 'ketua_tim' ? 'Ketua Tim' : 'Anggota';
                                }

                                const roleLabelMap = {
                                    admin: 'Admin',
                                    kepala: 'Kepala BPS',
                                    pegawai: 'Pegawai',
                                    sekretaris: 'Sekretaris'
                                };
                                const displayRole = roleLabelMap[u.role] || u.role;

                                let actionButtons = `
                                    <div class="cell-actions">
                                        <button class="btn-icon" onclick="openUserModal('${u.id}')" title="Edit Pengguna">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                        </button>
                                        <button class="btn-icon btn-icon-danger" onclick="deleteUser('${u.id}')" title="Hapus Pengguna">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                        </button>
                                    </div>
                                `;

                                // Protect deleting system accounts or current logged-in user
                                if (u.id === currentUser.id || u.username === 'admin' || u.username === 'kepala') {
                                    actionButtons = '<span style="color:var(--slate-400);font-size:12px;font-style:italic;">Protected</span>';
                                }

                                return `
                                    <tr>
                                        <td style="font-family: monospace;">${u.nip}</td>
                                        <td class="text-bold">${u.name}</td>
                                        <td>${u.username}</td>
                                        <td><span class="status-badge badge-info">${displayRole}</span></td>
                                        <td>${typeLabel}</td>
                                        <td>${actionButtons}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function openUserModal(userId = '') {
    const modal = document.getElementById('modal-user');
    const form = document.getElementById('user-form');
    const title = document.getElementById('user-modal-title');

    form.reset();
    document.getElementById('edit-user-id').value = '';
    
    // Toggle type field on initial load
    adjustUserTypeField();

    if (userId) {
        title.innerText = 'Edit Kredensial Pengguna';
        const user = users.find(u => u.id === userId);
        if (user) {
            document.getElementById('edit-user-id').value = user.id;
            document.getElementById('user-nip').value = user.nip;
            document.getElementById('user-fullname').value = user.name;
            document.getElementById('user-username').value = user.username;
            document.getElementById('user-password').value = user.password;
            document.getElementById('user-role').value = user.role;
            
            adjustUserTypeField();
            if (user.role === 'pegawai') {
                document.getElementById('user-type').value = user.type;
            }
        }
    } else {
        title.innerText = 'Tambah Pengguna Baru';
    }

    modal.classList.add('active');
}

function adjustUserTypeField() {
    const roleVal = document.getElementById('user-role').value;
    const typeContainer = document.getElementById('user-type-container');
    
    if (roleVal === 'pegawai') {
        typeContainer.classList.remove('hidden');
        document.getElementById('user-type').setAttribute('required', 'true');
    } else {
        typeContainer.classList.add('hidden');
        document.getElementById('user-type').removeAttribute('required');
    }
}

function saveUser(e) {
    e.preventDefault();
    const userId = document.getElementById('edit-user-id').value;
    const nip = document.getElementById('user-nip').value.trim();
    const name = document.getElementById('user-fullname').value.trim();
    const username = document.getElementById('user-username').value.trim().toLowerCase();
    const password = document.getElementById('user-password').value.trim();
    const role = document.getElementById('user-role').value;
    const type = role === 'pegawai' ? document.getElementById('user-type').value : '';

    // Check duplicate username
    const duplicate = users.find(u => u.username === username && u.id !== userId);
    if (duplicate) {
        alert('Gagal! Username ini sudah digunakan oleh akun lain.');
        return;
    }

    if (userId) {
        const idx = users.findIndex(u => u.id === userId);
        if (idx !== -1) {
            users[idx] = {
                ...users[idx],
                nip,
                name,
                username,
                password,
                role,
                type
            };
        }
    } else {
        const newUser = {
            id: 'usr-' + Date.now(),
            nip,
            name,
            username,
            password,
            role,
            type
        };
        users.push(newUser);
    }

    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    closeModal('modal-user');
    renderViewContent(currentView);
}

function deleteUser(userId) {
    if (confirm('Apakah Anda yakin ingin menghapus akun pengguna ini dari database?')) {
        users = users.filter(u => u.id !== userId);
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
        renderViewContent(currentView);
    }
}

// ==========================================================================
// 7. VIEW: ADMIN - SYSTEM SETTINGS & RESET DATABASE
// ==========================================================================
function renderAdminSettingsView(container) {
    container.innerHTML = `
        <div class="admin-card-row">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Pengendalian Basis Data</h3>
                </div>
                <div class="card-body admin-action-box">
                    <p style="font-size: 13.5px; color: var(--slate-600); margin-bottom: 10px;">
                        Untuk keperluan pengujian demo aplikasi SI-BUDI, Anda dapat mengatur ulang seluruh data local storage ke kondisi awal (default) untuk mereset seluruh kegiatan, penilaian, dan data pengguna.
                    </p>
                    <button class="btn btn-danger btn-block" onclick="resetSystemData()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                        <span>Reset Seluruh Data SI-BUDI</span>
                    </button>
                    <p class="form-help text-red">*Peringatan: Seluruh data baru yang Anda masukkan akan hilang.</p>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Informasi Sistem</h3>
                </div>
                <div class="card-body">
                    <div class="detail-item">
                        <span class="detail-label">Nama Aplikasi</span>
                        <span class="detail-val text-bold">SI-BUDI BPS Kabupaten Sigi</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status Integrasi</span>
                        <span class="detail-val"><span class="status-badge badge-success">Terhubung (KipAPP)</span></span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Teknologi</span>
                        <span class="detail-val">SPA - HTML5, CSS3, ES6 JavaScript, LocalStorage API</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function resetSystemData() {
    if (confirm('Apakah Anda yakin ingin melakukan factory reset data? Semua laporan, penilaian, dan akun kustom akan dihapus permanen!')) {
        localStorage.removeItem(STORAGE_KEY_USERS);
        localStorage.removeItem(STORAGE_KEY_ACTIVITIES);
        localStorage.removeItem(STORAGE_KEY_KIPAPP);
        
        // Reinitialize
        initDatabase();
        
        alert('Basis data SI-BUDI berhasil di-reset ke kondisi awal!');
        
        // Log back out to admin dashboard
        switchView('summary');
    }
}

// ==========================================================================
// MODAL GENERAL CONTROLS
// ==========================================================================
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ==========================================================================
// HELPER FUNCTIONS
// ==========================================================================
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${parts[2]} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
}
