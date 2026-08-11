# Panduan Scraping KipAPP BPS via Browser Console

Dokumen ini menyediakan script scraping otomatis yang bisa dijalankan langsung di tab browser Anda yang sedang membuka **KipAPP BPS** (`https://kipapp.bps.go.id`). 

Setiap script dilengkapi dengan sistem **auto-detect token** untuk membaca token otorisasi `x-auth` Anda dari browser agar terhindar dari error `401 Unauthorized`.

---

## DAFTAR SCRIPT SCRAPING

1. **[Script 1: Data Tim Kerja & Anggota](#script-1-data-tim-kerja--anggota)** (Untuk proyek per tim dan daftar anggotanya)
2. **[Script 2: Matriks Rencana Kinerja](#script-2-matriks-rencana-kinerja)** (Untuk detail matriks/butir rencana kinerja per tim kerja)

---

## SCRIPT 1: DATA TIM KERJA & ANGGOTA
*ID Target: 106506 s.d 106517 & 158561*

Salin kode di bawah ini dan jalankan di Console browser Anda:

```javascript
(async () => {
    console.log("=== MEMULAI SCRAPING DATA PROFIL TIM KIPAPP ===");
    
    function findJwtToken() {
        function searchObjForJwt(obj) {
            if (!obj || typeof obj !== 'object') return null;
            for (const [k, v] of Object.entries(obj)) {
                if (typeof v === 'string') {
                    if (v.startsWith('Bearer eyJ') && v.split('.').length === 3) return v;
                    if (v.startsWith('eyJ') && v.split('.').length === 3) return 'Bearer ' + v;
                } else if (typeof v === 'object') {
                    const found = searchObjForJwt(v);
                    if (found) return found;
                }
            }
            return null;
        }
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const val = localStorage.getItem(key);
            if (typeof val === 'string') {
                if (val.startsWith('Bearer eyJ') && val.split('.').length === 3) return val;
                if (val.startsWith('eyJ') && val.split('.').length === 3) return 'Bearer ' + val;
                try {
                    const parsed = JSON.parse(val);
                    const found = searchObjForJwt(parsed);
                    if (found) return found;
                } catch(e) {}
            }
        }
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const val = sessionStorage.getItem(key);
            if (typeof val === 'string') {
                if (val.startsWith('Bearer eyJ') && val.split('.').length === 3) return val;
                if (val.startsWith('eyJ') && val.split('.').length === 3) return 'Bearer ' + val;
                try {
                    const parsed = JSON.parse(val);
                    const found = searchObjForJwt(parsed);
                    if (found) return found;
                } catch(e) {}
            }
        }
        return null;
    }

    let token = findJwtToken();
    if (token) {
        console.log("[Auto-Detect] Berhasil mendeteksi token x-auth dari penyimpanan browser.");
    } else {
        console.log("[Info] Token tidak ditemukan otomatis. Meminta input dari pengguna...");
        const userInput = prompt("Masukkan nilai header x-auth Anda (contoh: Bearer eyJ0eX...):");
        if (!userInput || !userInput.trim()) {
            console.error("Proses dibatalkan: Token tidak boleh kosong!");
            return;
        }
        token = userInput.trim();
        if (!token.startsWith('Bearer ') && token.startsWith('eyJ')) {
            token = 'Bearer ' + token;
        }
    }

    const startId = 106506;
    const endId = 106517;
    const additionalId = 158561;

    const ids = [];
    for (let id = startId; id <= endId; id++) {
        ids.push(id);
    }
    ids.push(additionalId);

    const results = [];

    function downloadFile(content, fileName, contentType) {
        const a = document.createElement("a");
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function escapeCsvValue(val) {
        if (val === undefined || val === null) return '';
        let str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            str = '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }

    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const url = `https://kipapp.bps.go.id/api/v1/timkerja?id=${id}`;
        console.log(`[${i + 1}/${ids.length}] Menarik data dari: ${url}...`);

        try {
            const response = await fetch(url, {
                headers: {
                    'x-auth': token,
                    'accept': 'application/json, text/plain, */*'
                }
            });
            
            if (!response.ok) {
                console.error(`[Error] ID ${id} gagal ditarik. Status: ${response.status}`);
                if (response.status === 401) {
                    console.error("Token kedaluwarsa atau salah!");
                    break;
                }
                continue;
            }

            const json = await response.json();
            results.push({ id, status: 'success', data: json });
            console.log(`[Success] ID ${id} berhasil didapatkan.`);
        } catch (error) {
            console.error(`[Error] Gagal mengakses ID ${id}:`, error.message);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (results.length === 0) {
        console.error("Tidak ada data yang berhasil diunduh.");
        return;
    }

    console.log("Mengunduh JSON...");
    downloadFile(JSON.stringify(results, null, 2), "kipapp_data.json", "application/json");

    console.log("Memulai konversi data ke format CSV...");
    try {
        const flatRows = [];
        const projectKeysSet = new Set();
        const memberKeysSet = new Set();

        for (const item of results) {
            const rawData = item.data;
            if (!rawData) continue;
            
            let project = rawData;
            if (rawData.data && typeof rawData.data === 'object' && !Array.isArray(rawData.data)) {
                project = rawData.data;
            }

            const projectFields = {};
            let membersArray = [];

            for (const [key, value] of Object.entries(project)) {
                if (Array.isArray(value)) {
                    if (value.length > 0 && typeof value[0] === 'object') {
                        if (value.length > membersArray.length) {
                            membersArray = value;
                        }
                    }
                } else if (value !== null && typeof value !== 'object') {
                    projectFields[key] = value;
                    projectKeysSet.add(key);
                }
            }

            if (membersArray.length > 0) {
                for (const member of membersArray) {
                    const row = { ...projectFields };
                    for (const [mKey, mVal] of Object.entries(member)) {
                        if (mVal !== null && typeof mVal !== 'object') {
                            const csvKey = `anggota_${mKey}`;
                            row[csvKey] = mVal;
                            memberKeysSet.add(csvKey);
                        }
                    }
                    flatRows.push(row);
                }
            } else {
                flatRows.push(projectFields);
            }
        }

        const projectKeys = Array.from(projectKeysSet);
        const memberKeys = Array.from(memberKeysSet);
        const csvHeaders = [...projectKeys, ...memberKeys];

        let csvContent = csvHeaders.map(escapeCsvValue).join(',') + '\n';
        for (const row of flatRows) {
            const rowValues = csvHeaders.map(header => escapeCsvValue(row[header]));
            csvContent += rowValues.join(',') + '\n';
        }

        downloadFile(csvContent, "kipapp_anggota.csv", "text/csv;charset=utf-8;");
        console.log(`[Success] CSV diunduh! Total: ${flatRows.length} baris.`);
    } catch (csvError) {
        console.error("Gagal mengonversi CSV:", csvError.message);
    }
    console.log("=== SCRAPING SELESAI ===");
})();
```

---

## SCRIPT 2: MATRIKS RENCANA KINERJA
*ID Target Level 1: 60691*
*ID Target Level 2: 106506 s.d 106517 & 158561*

Salin kode di bawah ini dan jalankan di Console browser Anda untuk menarik data rencana kinerja / matriks:

```javascript
(async () => {
    console.log("=== MEMULAI SCRAPING DATA MATRIKS KINERJA KIPAPP ===");
    
    function findJwtToken() {
        function searchObjForJwt(obj) {
            if (!obj || typeof obj !== 'object') return null;
            for (const [k, v] of Object.entries(obj)) {
                if (typeof v === 'string') {
                    if (v.startsWith('Bearer eyJ') && v.split('.').length === 3) return v;
                    if (v.startsWith('eyJ') && v.split('.').length === 3) return 'Bearer ' + v;
                } else if (typeof v === 'object') {
                    const found = searchObjForJwt(v);
                    if (found) return found;
                }
            }
            return null;
        }
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const val = localStorage.getItem(key);
            if (typeof val === 'string') {
                if (val.startsWith('Bearer eyJ') && val.split('.').length === 3) return val;
                if (val.startsWith('eyJ') && val.split('.').length === 3) return 'Bearer ' + val;
                try {
                    const parsed = JSON.parse(val);
                    const found = searchObjForJwt(parsed);
                    if (found) return found;
                } catch(e) {}
            }
        }
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const val = sessionStorage.getItem(key);
            if (typeof val === 'string') {
                if (val.startsWith('Bearer eyJ') && val.split('.').length === 3) return val;
                if (val.startsWith('eyJ') && val.split('.').length === 3) return 'Bearer ' + val;
                try {
                    const parsed = JSON.parse(val);
                    const found = searchObjForJwt(parsed);
                    if (found) return found;
                } catch(e) {}
            }
        }
        return null;
    }

    let token = findJwtToken();
    if (token) {
        console.log("[Auto-Detect] Berhasil mendeteksi token x-auth dari penyimpanan browser.");
    } else {
        console.log("[Info] Token tidak ditemukan otomatis. Meminta input dari pengguna...");
        const userInput = prompt("Masukkan nilai header x-auth Anda (contoh: Bearer eyJ0eX...):");
        if (!userInput || !userInput.trim()) {
            console.error("Proses dibatalkan: Token tidak boleh kosong!");
            return;
        }
        token = userInput.trim();
        if (!token.startsWith('Bearer ') && token.startsWith('eyJ')) {
            token = 'Bearer ' + token;
        }
    }

    const level2Ids = [106506, 106507, 106508, 106509, 106510, 106511, 106512, 106513, 106514, 106515, 106516, 106517, 158561];
    
    // Siapkan daftar target url
    const targets = [];
    // Level 1
    targets.push({
        url: "https://kipapp.bps.go.id/api/v1/timkerja/matriks?periodeid=8&wilayahid=7210_11&unitkerjaid=101&timkerjaid=60691&leveltim=1",
        level: 1,
        id: 60691
    });
    // Level 2
    for (const id of level2Ids) {
        targets.push({
            url: `https://kipapp.bps.go.id/api/v1/timkerja/matriks?periodeid=8&wilayahid=7210_11&unitkerjaid=101&timkerjaid=${id}&leveltim=2`,
            level: 2,
            id: id
        });
    }

    const results = [];

    function downloadFile(content, fileName, contentType) {
        const a = document.createElement("a");
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function escapeCsvValue(val) {
        if (val === undefined || val === null) return '';
        let str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            str = '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }

    // Fetch Loop
    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        console.log(`[${i + 1}/${targets.length}] Menarik matriks Level ${target.level} ID ${target.id} dari: ${target.url}...`);

        try {
            const response = await fetch(target.url, {
                headers: {
                    'x-auth': token,
                    'accept': 'application/json, text/plain, */*'
                }
            });
            
            if (!response.ok) {
                console.error(`[Error] Matriks Level ${target.level} ID ${target.id} gagal. Status: ${response.status}`);
                if (response.status === 401) {
                    console.error("Token kedaluwarsa atau salah!");
                    break;
                }
                continue;
            }

            const json = await response.json();
            results.push({ id: target.id, level: target.level, status: 'success', data: json });
            console.log(`[Success] Matriks Level ${target.level} ID ${target.id} berhasil didapatkan.`);
        } catch (error) {
            console.error(`[Error] Gagal mengakses Matriks Level ${target.level} ID ${target.id}:`, error.message);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (results.length === 0) {
        console.error("Tidak ada data matriks yang berhasil diunduh.");
        return;
    }

    // Download JSON
    console.log("Mengunduh JSON Matriks...");
    downloadFile(JSON.stringify(results, null, 2), "kipapp_matriks_data.json", "application/json");

    // Download CSV
    console.log("Memulai konversi data ke format CSV...");
    try {
        const flatRows = [];
        const outerKeysSet = new Set();
        const innerKeysSet = new Set();

        for (const item of results) {
            const rawData = item.data;
            if (!rawData) continue;
            
            const metaFields = {
                target_leveltim: item.level,
                target_timkerjaid: item.id
            };
            
            let project = rawData;
            if (rawData.data && typeof rawData.data === 'object' && !Array.isArray(rawData.data)) {
                project = rawData.data;
            }

            const outerFields = { ...metaFields };
            let arraysList = [];

            // Pisahkan field umum dan array (misal matriks / butir kinerja)
            for (const [key, value] of Object.entries(project)) {
                if (Array.isArray(value)) {
                    if (value.length > 0 && typeof value[0] === 'object') {
                        arraysList.push({ name: key, data: value });
                    }
                } else if (value !== null && typeof value !== 'object') {
                    outerFields[key] = value;
                    outerKeysSet.add(key);
                }
            }
            outerKeysSet.add('target_leveltim');
            outerKeysSet.add('target_timkerjaid');

            if (arraysList.length > 0) {
                for (const arrInfo of arraysList) {
                    for (const rowObj of arrInfo.data) {
                        const row = { ...outerFields, array_name: arrInfo.name };
                        outerKeysSet.add('array_name');
                        
                        for (const [rKey, rVal] of Object.entries(rowObj)) {
                            if (Array.isArray(rVal)) {
                                if (rVal.length > 0) {
                                    row[`item_${rKey}`] = JSON.stringify(rVal);
                                    innerKeysSet.add(`item_${rKey}`);
                                }
                            } else if (rVal !== null && typeof rVal === 'object') {
                                for (const [subKey, subVal] of Object.entries(rVal)) {
                                    if (subVal !== null && typeof subVal !== 'object') {
                                        row[`item_${rKey}_${subKey}`] = subVal;
                                        innerKeysSet.add(`item_${rKey}_${subKey}`);
                                    }
                                }
                            } else if (rVal !== null) {
                                row[`item_${rKey}`] = rVal;
                                innerKeysSet.add(`item_${rKey}`);
                            }
                        }
                        flatRows.push(row);
                    }
                }
            } else {
                flatRows.push(outerFields);
            }
        }

        // Susun CSV
        const outerKeys = Array.from(outerKeysSet);
        const innerKeys = Array.from(innerKeysSet);
        const csvHeaders = [...outerKeys, ...innerKeys];

        let csvContent = csvHeaders.map(escapeCsvValue).join(',') + '\n';
        for (const row of flatRows) {
            const rowValues = csvHeaders.map(header => escapeCsvValue(row[header]));
            csvContent += rowValues.join(',') + '\n';
        }

        downloadFile(csvContent, "kipapp_matriks_anggota.csv", "text/csv;charset=utf-8;");
        console.log(`[Success] CSV Matriks diunduh! Total: ${flatRows.length} baris.`);
    } catch (csvError) {
        console.error("Gagal mengonversi CSV Matriks:", csvError.message);
    }

    console.log("=== SCRAPING MATRIKS SELESAI ===");
})();
```
