const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Config
const startId = 106506;
const endId = 106517;
const additionalId = 158561;

// Generate list of IDs to fetch
const ids = [];
for (let id = startId; id <= endId; id++) {
    ids.push(id);
}
ids.push(additionalId);

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

function escapeCsvValue(val) {
    if (val === undefined || val === null) return '';
    let str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        str = '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
}

async function run() {
    console.log('=== KIPAPP BPS SCRAPER ===');
    console.log('Script ini akan mengambil data tim kerja dari API KipAPP.');
    console.log('API membutuhkan otorisasi. Silakan ikuti instruksi di implementation_plan.md untuk mendapatkan token.');
    console.log('--------------------------------------------------');

    let authHeader = '';
    let cookieHeader = '';

    const tokenFilePath = path.join(__dirname, 'token.txt');
    if (fs.existsSync(tokenFilePath)) {
        console.log(`[Config] Membaca token dari ${tokenFilePath}...`);
        const fileContent = fs.readFileSync(tokenFilePath, 'utf8');
        const lines = fileContent.split(/\r?\n/);
        authHeader = lines[0] ? lines[0].trim() : '';
        cookieHeader = lines[1] ? lines[1].trim() : '';
    } else {
        authHeader = await askQuestion('Masukkan nilai Header Authorization (contoh: Bearer eyJ... atau X-Auth: Bearer eyJ...): ');
        if (!authHeader.trim()) {
            console.error('Error: Header Authorization tidak boleh kosong!');
            process.exit(1);
        }
        cookieHeader = await askQuestion('Masukkan Cookie (opsional, tekan Enter jika tidak diperlukan): ');
    }

    let authHeaderName = 'Authorization';
    let authHeaderValue = authHeader.trim();

    if (authHeaderValue.includes(':')) {
        const parts = authHeaderValue.split(':');
        authHeaderName = parts[0].trim();
        authHeaderValue = parts.slice(1).join(':').trim();
    }

    console.log('\nMemulai proses scraping...');
    const results = [];
    const headers = {
        [authHeaderName.toLowerCase()]: authHeaderValue,
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9,id;q=0.8,sv;q=0.7',
        'sec-ch-ua': '"Not;A=Brand";v="8", "Chromium";v="150", "Microsoft Edge";v="150"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'Referer': 'https://kipapp.bps.go.id/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    if (cookieHeader.trim()) {
        headers['cookie'] = cookieHeader.trim();
    }

    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const url = `https://kipapp.bps.go.id/api/v1/timkerja?id=${id}`;
        console.log(`[${i + 1}/${ids.length}] Menarik data dari: ${url}...`);

        try {
            const response = await fetch(url, { headers });
            
            if (!response.ok) {
                console.error(`[Error] ID ${id} gagal ditarik. Status: ${response.status} ${response.statusText}`);
                if (response.status === 401) {
                    console.error('Token kedaluwarsa atau salah. Silakan periksa kembali token Anda.');
                    break;
                }
                continue;
            }

            const json = await response.json();
            results.push({ id, status: 'success', data: json });
            console.log(`[Success] ID ${id} berhasil diunduh.`);
        } catch (error) {
            console.error(`[Error] Gagal mengakses ID ${id}:`, error.message);
        }

        // Jeda singkat agar tidak membebani server (rate limiting)
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    if (results.length === 0) {
        console.error('\nTidak ada data yang berhasil diunduh. Proses dibatalkan.');
        return;
    }

    // Save JSON
    const jsonPath = path.join(__dirname, 'kipapp_data.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\n[Save] Data mentah berhasil disimpan ke: ${jsonPath}`);

    // Flatten to CSV
    console.log('Memulai konversi data ke format CSV...');
    try {
        const flatRows = [];
        const projectKeysSet = new Set();
        const memberKeysSet = new Set();

        for (const item of results) {
            // Unpack if there is a inner wrapper "data"
            const rawData = item.data;
            if (!rawData) continue;
            
            // Checking if response is structured as { status, data: { ... } } or similar
            let project = rawData;
            if (rawData.data && typeof rawData.data === 'object' && !Array.isArray(rawData.data)) {
                project = rawData.data;
            }

            const projectFields = {};
            let membersArray = [];

            // Separate project-level fields and arrays (like members)
            for (const [key, value] of Object.entries(project)) {
                if (Array.isArray(value)) {
                    // Check if array has objects (likely members or performance plans)
                    if (value.length > 0 && typeof value[0] === 'object') {
                        // We will consider the largest array of objects as the member list
                        if (value.length > membersArray.length) {
                            membersArray = value;
                        }
                    }
                } else if (value !== null && typeof value !== 'object') {
                    projectFields[key] = value;
                    projectKeysSet.add(key);
                }
            }

            // If members array is found
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
                // If no members, just add project level data
                flatRows.push(projectFields);
            }
        }

        // Construct CSV
        const projectKeys = Array.from(projectKeysSet);
        const memberKeys = Array.from(memberKeysSet);
        const csvHeaders = [...projectKeys, ...memberKeys];

        let csvContent = csvHeaders.map(escapeCsvValue).join(',') + '\n';
        for (const row of flatRows) {
            const rowValues = csvHeaders.map(header => {
                const val = row[header];
                return escapeCsvValue(val);
            });
            csvContent += rowValues.join(',') + '\n';
        }

        const csvPath = path.join(__dirname, 'kipapp_anggota.csv');
        fs.writeFileSync(csvPath, csvContent, 'utf8');
        console.log(`[Save] Data CSV berhasil disimpan ke: ${csvPath}`);
        console.log(`Total data terkonversi: ${flatRows.length} baris anggota tim.`);
    } catch (csvError) {
        console.error('[Error] Gagal mengonversi data ke CSV:', csvError.message);
    }

    console.log('\n=== SELESAI ===');
}

run();
