// js/app.js - FIXED VERSION
const api = new MobinimeAPI();
const mainContent = document.getElementById('main-content');
const loader = document.getElementById('loader');

function showLoader() {
    loader.classList.remove('hidden');
}

function hideLoader() {
    loader.classList.add('hidden');
}

// Test API connection sebelum memulai
async function testAPIConnection() {
    showLoader();
    try {
        const result = await api.testConnection();
        console.log('API Test Result:', result);
        
        if (!result.ok) {
            showErrorPage(`
                <h3 class="text-xl text-red-500 mb-2">API Server Down</h3>
                <p class="text-gray-400 mb-4">
                    Server API sedang tidak dapat diakses. 
                    ${result.api === 'Both APIs down' ? 'Semua server backup juga down.' : 'Menggunakan server backup.'}
                </p>
                <div class="text-left bg-black/30 p-4 rounded-lg mb-4">
                    <p class="text-sm text-gray-500">Status:</p>
                    <ul class="text-xs text-gray-400 mt-2 space-y-1">
                        <li>• Main API: ${result.api === 'Main API' ? '✓ Online' : '✗ Offline'}</li>
                        <li>• Backup API: ${result.api === 'Backup API' ? '✓ Online' : '✗ Offline'}</li>
                    </ul>
                </div>
            `);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('API Test Error:', error);
        showErrorPage(`
            <h3 class="text-xl text-red-500 mb-2">Connection Error</h3>
            <p class="text-gray-400 mb-4">Tidak dapat terhubung ke server API</p>
        `);
        return false;
    } finally {
        hideLoader();
    }
}

function showErrorPage(message) {
    mainContent.innerHTML = `
        <div class="min-h-[60vh] flex items-center justify-center">
            <div class="text-center max-w-md">
                <div class="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8">
                    <div class="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fas fa-exclamation-triangle text-3xl text-red-500"></i>
                    </div>
                    ${message}
                    <div class="mt-6 space-y-3">
                        <button onclick="testAndReload()" class="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg transition">
                            <i class="fas fa-redo mr-2"></i>Coba Lagi
                        </button>
                        <button onclick="loadHome()" class="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 px-6 rounded-lg transition">
                            <i class="fas fa-home mr-2"></i>Refresh Halaman
                        </button>
                    </div>
                    <p class="text-xs text-gray-600 mt-6">
                        Jika error terus berlanjut, server API mungkin sedang maintenance.
                    </p>
                </div>
            </div>
        </div>
    `;
}

async function testAndReload() {
    const isConnected = await testAPIConnection();
    if (isConnected) {
        loadHome();
    }
}

// 1. LOAD HOME
async function loadHome() {
    showLoader();
    try {
        const response = await api.homepage();
        console.log('Homepage Response:', response);
        
        // Handle berbagai format response
        let animeList = [];
        
        if (response?.data?.new_anime) {
            animeList = response.data.new_anime;
        } else if (response?.new_anime) {
            animeList = response.new_anime;
        } else if (Array.isArray(response)) {
            animeList = response;
        } else if (response?.data && Array.isArray(response.data)) {
            animeList = response.data;
        }
        
        console.log('Anime List:', animeList);
        
        let html = `
            <div class="mb-8">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold text-red-500 border-l-4 border-red-600 pl-3">Anime Terbaru</h2>
                    ${api.isMainApiDown ? 
                        '<span class="text-xs bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full">Backup Server</span>' : 
                        ''
                    }
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        `;
        
        if (animeList && animeList.length > 0) {
            animeList.forEach(anime => {
                const id = anime.id || anime.anime_id || '';
                const title = anime.title || anime.judul || 'Unknown';
                const cover = anime.cover || anime.image || anime.thumbnail || 'https://via.placeholder.com/300x400/1a1a1a/ffffff?text=No+Image';
                const episode = anime.param || anime.episode || '';
                
                if (!id) return;
                
                html += `
                    <div class="group cursor-pointer animate-fade-in" onclick="loadDetail('${id}')">
                        <div class="relative aspect-[3/4] overflow-hidden rounded-xl mb-3 shadow-lg">
                            <img src="${cover}" 
                                 alt="${title}"
                                 class="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                                 onerror="this.onerror=null; this.src='https://via.placeholder.com/300x400/1a1a1a/ffffff?text=Image+Error'">
                            
                            ${episode ? `
                            <div class="absolute top-2 left-2">
                                <span class="text-xs bg-red-600 text-white px-2 py-1 rounded font-bold">
                                    ${episode}
                                </span>
                            </div>
                            ` : ''}
                            
                            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300">
                                <div class="absolute bottom-3 left-3 right-3">
                                    <h3 class="text-white text-sm font-semibold line-clamp-2">${title}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            html += `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-film text-4xl text-gray-600 mb-3"></i>
                    <p class="text-gray-400">Tidak ada anime tersedia</p>
                    <p class="text-xs text-gray-600 mt-2">Response API kosong atau format tidak dikenali</p>
                </div>
            `;
        }
        
        html += `</div></div>`;
        mainContent.innerHTML = html;
        
    } catch (error) {
        console.error('Load Home Error:', error);
        showErrorPage(`
            <h3 class="text-xl text-red-500 mb-2">Failed to Load Anime</h3>
            <p class="text-gray-400 mb-4">${error.message || 'Unknown error occurred'}</p>
            <div class="text-left bg-black/30 p-4 rounded-lg">
                <p class="text-sm text-gray-500">Debug Info:</p>
                <code class="text-xs text-gray-400 block mt-2 p-2 bg-black rounded overflow-auto">
                    ${error.toString()}
                </code>
            </div>
        `);
    } finally {
        hideLoader();
    }
}

// 2. SEARCH
async function handleSearch(event) {
    event.preventDefault();
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;
    
    showLoader();
    try {
        const response = await api.search(query);
        
        let results = [];
        if (response?.data) {
            results = response.data;
        } else if (Array.isArray(response)) {
            results = response;
        }
        
        let html = `
            <div class="mb-8">
                <button onclick="loadHome()" class="text-gray-400 hover:text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-arrow-left"></i> Kembali
                </button>
                <h2 class="text-xl font-bold text-white mb-6">Hasil pencarian: "${query}"</h2>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        `;
        
        if (results.length > 0) {
            results.forEach(anime => {
                const id = anime.id || anime.anime_id || '';
                const title = anime.title || anime.judul || '';
                const cover = anime.cover || anime.image || '';
                
                if (!id) return;
                
                html += `
                    <div class="cursor-pointer" onclick="loadDetail('${id}')">
                        <img src="${cover}" class="w-full aspect-[3/4] object-cover rounded-lg">
                        <h3 class="text-white text-sm mt-2 truncate">${title}</h3>
                    </div>
                `;
            });
        } else {
            html += '<p class="col-span-5 text-gray-400 text-center py-8">Tidak ditemukan</p>';
        }
        
        html += '</div></div>';
        mainContent.innerHTML = html;
        
    } catch (error) {
        console.error('Search Error:', error);
        alert('Gagal mencari: ' + error.message);
    } finally {
        hideLoader();
    }
}

// 3. DETAIL
async function loadDetail(id) {
    if (!id) {
        alert('ID tidak valid');
        return;
    }
    
    showLoader();
    try {
        const response = await api.detail(id);
        console.log('Detail Response:', response);
        
        const anime = response?.data || response || {};
        
        let episodesHtml = '';
        const episodes = anime.list_episode || anime.episodes || [];
        
        if (episodes.length > 0) {
            episodes.forEach(eps => {
                const epId = eps.id || eps.episode_id || eps.episode;
                const epNum = eps.episode || eps.eps || '';
                
                if (!epId) return;
                
                episodesHtml += `
                    <button onclick="playVideo('${anime.id || id}', '${epId}', '${epNum}')" 
                            class="bg-gray-800 hover:bg-red-600 text-white px-3 py-2 rounded transition">
                        ${epNum}
                    </button>
                `;
            });
        } else {
            episodesHtml = '<p class="text-gray-500">Belum ada episode</p>';
        }
        
        const html = `
            <div class="bg-[#1a1a1a] p-4 md:p-6 rounded-xl">
                <button onclick="loadHome()" class="text-white mb-6 flex items-center gap-2">
                    <i class="fas fa-arrow-left"></i> Kembali
                </button>
                
                <div class="md:flex gap-6">
                    <div class="md:w-1/3 mb-6 md:mb-0">
                        <img src="${anime.cover || anime.image}" 
                             class="w-full rounded-xl shadow-lg"
                             onerror="this.src='https://via.placeholder.com/300x400/1a1a1a/ffffff?text=No+Image'">
                    </div>
                    
                    <div class="md:w-2/3">
                        <h1 class="text-2xl md:text-3xl text-red-500 font-bold mb-3">${anime.title || anime.judul || 'Unknown'}</h1>
                        
                        <div class="flex flex-wrap gap-2 mb-4">
                            ${anime.type ? `<span class="bg-gray-800 px-3 py-1 rounded text-sm">${anime.type}</span>` : ''}
                            ${anime.status ? `<span class="bg-gray-800 px-3 py-1 rounded text-sm">${anime.status}</span>` : ''}
                            ${anime.score ? `<span class="bg-gray-800 px-3 py-1 rounded text-sm"><i class="fas fa-star text-yellow-500 mr-1"></i>${anime.score}</span>` : ''}
                        </div>
                        
                        <p class="text-gray-300 mb-6">${anime.synopsis || anime.description || 'Tidak ada sinopsis'}</p>
                        
                        ${anime.genre ? `<p class="text-gray-400 mb-2"><strong>Genre:</strong> ${anime.genre}</p>` : ''}
                        
                        <div class="mt-8">
                            <h3 class="text-xl text-white mb-4">Episode (${episodes.length})</h3>
                            <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                                ${episodesHtml}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        mainContent.innerHTML = html;
        
    } catch (error) {
        console.error('Detail Error:', error);
        alert('Gagal memuat detail: ' + error.message);
    } finally {
        hideLoader();
    }
}

// 4. PLAY VIDEO
async function playVideo(animeId, epsId, epsNumber) {
    if (!animeId || !epsId) {
        alert('ID video tidak valid');
        return;
    }
    
    showLoader();
    
    const modal = document.getElementById('video-modal');
    const video = document.getElementById('video-player');
    const title = document.getElementById('video-title');
    
    title.textContent = `Episode ${epsNumber || ''}`;
    modal.classList.remove('hidden');
    
    try {
        const videoUrl = await api.getStreamUrl(animeId, epsId);
        console.log('Video URL to play:', videoUrl);
        
        if (!videoUrl) {
            throw new Error('URL video kosong');
        }
        
        // HLS Support
        if (Hls.isSupported()) {
            if (window.currentHls) {
                window.currentHls.destroy();
            }
            
            const hls = new Hls();
            window.currentHls = hls;
            
            hls.loadSource(videoUrl);
            hls.attachMedia(video);
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(e => {
                    console.log('Auto-play blocked, click to play');
                });
                hideLoader();
            });
            
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = videoUrl;
            video.addEventListener('loadedmetadata', () => {
                video.play();
                hideLoader();
            });
        } else {
            video.src = videoUrl;
            video.load();
            hideLoader();
        }
        
    } catch (error) {
        console.error('Play Video Error:', error);
        hideLoader();
        alert(`Gagal memutar: ${error.message}`);
        closePlayer();
    }
}

function closePlayer() {
    const modal = document.getElementById('video-modal');
    const video = document.getElementById('video-player');
    
    video.pause();
    video.src = '';
    
    if (window.currentHls) {
        window.currentHls.destroy();
        window.currentHls = null;
    }
    
    modal.classList.add('hidden');
}

// Inisialisasi
async function init() {
    // Test API connection dulu
    const isConnected = await testAPIConnection();
    if (isConnected) {
        loadHome();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', init);

document.getElementById('search-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch(e);
    }
});
