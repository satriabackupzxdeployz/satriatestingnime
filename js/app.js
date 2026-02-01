// js/app.js - SIMPLIFIED WORKING VERSION

const api = new MobinimeAPI();
const mainContent = document.getElementById('main-content');
const loader = document.getElementById('loader');

// --- Utilities ---
const showLoader = () => {
    loader.classList.remove('hidden');
    mainContent.classList.add('opacity-50');
};

const hideLoader = () => {
    loader.classList.add('hidden');
    mainContent.classList.remove('opacity-50');
};

// --- Views ---

// 1. Render Home
async function loadHome() {
    showLoader();
    try {
        const response = await api.homepage();
        
        // Pastikan kita punya data
        const animeList = response?.data?.new_anime || [];
        
        let html = `
            <div class="mb-8">
                <h2 class="text-2xl font-bold text-red-500 mb-6 border-l-4 border-red-600 pl-3">Anime Terbaru</h2>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        `;

        if (animeList.length > 0) {
            animeList.forEach(anime => {
                html += createCard(anime);
            });
        } else {
            html += `
                <div class="col-span-full text-center py-10">
                    <i class="fas fa-film text-4xl text-gray-700 mb-3"></i>
                    <p class="text-gray-400">Tidak ada anime tersedia</p>
                </div>
            `;
        }
        
        html += `</div></div>`;
        mainContent.innerHTML = html;
    } catch (error) {
        console.error('Home error:', error);
        mainContent.innerHTML = `
            <div class="text-center py-20">
                <i class="fas fa-wifi text-4xl text-red-500 mb-4"></i>
                <h3 class="text-xl text-white mb-2">Koneksi Bermasalah</h3>
                <p class="text-gray-400 mb-4">Tidak dapat terhubung ke server</p>
                <button onclick="loadHome()" class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg">
                    <i class="fas fa-redo mr-2"></i>Coba Lagi
                </button>
            </div>
        `;
    } finally {
        hideLoader();
    }
}

// 2. Render Search
async function handleSearch(event) {
    event.preventDefault();
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    showLoader();
    try {
        const results = await api.search(query);
        
        let html = `
            <div class="mb-8">
                <button onclick="loadHome()" class="text-gray-400 hover:text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-arrow-left"></i> Kembali
                </button>
                <h2 class="text-xl font-bold text-white mb-6">Hasil pencarian: "${query}"</h2>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        `;

        if (results && results.length > 0) {
            results.forEach(anime => {
                html += createCard(anime);
            });
        } else {
            html += `
                <div class="col-span-full text-center py-10">
                    <i class="fas fa-search text-4xl text-gray-700 mb-3"></i>
                    <p class="text-gray-400">Tidak ditemukan anime dengan kata kunci "${query}"</p>
                </div>
            `;
        }

        html += `</div></div>`;
        mainContent.innerHTML = html;
    } catch (error) {
        console.error('Search error:', error);
        mainContent.innerHTML = `
            <div class="text-center py-10 text-red-500">
                Gagal melakukan pencarian
            </div>
        `;
    } finally {
        hideLoader();
    }
}

// 3. Render Detail
async function loadDetail(id) {
    showLoader();
    window.scrollTo(0,0);
    try {
        const anime = await api.detail(id);
        
        // Generate episode buttons
        let epsButtons = '';
        if(anime.list_episode && anime.list_episode.length > 0) {
            anime.list_episode.forEach(eps => {
                epsButtons += `
                    <button onclick="playVideo('${anime.id}', '${eps.id || eps.episode}', '${eps.episode}')" 
                        class="bg-gray-800 hover:bg-red-600 text-white text-sm py-2 px-3 rounded transition">
                        ${eps.episode}
                    </button>
                `;
            });
        } else {
            epsButtons = '<p class="text-gray-500 col-span-full text-center py-4">Belum ada episode.</p>';
        }

        const html = `
            <div class="bg-[#1a1a1a] rounded-xl p-6">
                <button onclick="loadHome()" class="text-gray-400 hover:text-white mb-6 flex items-center gap-2">
                    <i class="fas fa-arrow-left"></i> Kembali ke Beranda
                </button>

                <div class="flex flex-col lg:flex-row gap-6">
                    <div class="w-full lg:w-1/3 max-w-md">
                        <img src="${anime.cover || 'https://via.placeholder.com/300x400'}" 
                             class="w-full rounded-xl shadow-lg">
                    </div>
                    
                    <div class="flex-1">
                        <h1 class="text-3xl font-bold text-red-500 mb-3">${anime.title || 'Unknown Title'}</h1>
                        
                        <div class="flex flex-wrap gap-2 mb-4">
                            ${anime.type ? `<span class="bg-gray-800 px-3 py-1 rounded">${anime.type}</span>` : ''}
                            ${anime.status ? `<span class="bg-gray-800 px-3 py-1 rounded">${anime.status}</span>` : ''}
                            ${anime.score ? `<span class="bg-gray-800 px-3 py-1 rounded"><i class="fas fa-star text-yellow-500"></i> ${anime.score}</span>` : ''}
                        </div>
                        
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-white mb-2">Sinopsis</h3>
                            <p class="text-gray-300 leading-relaxed">${anime.synopsis || 'Tidak ada sinopsis.'}</p>
                        </div>
                        
                        ${anime.genre ? `<p class="text-gray-400 mb-2"><strong>Genre:</strong> ${anime.genre}</p>` : ''}
                        
                        <div class="mt-8">
                            <h3 class="text-xl font-semibold text-white mb-4">Episode List</h3>
                            <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                ${epsButtons}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        mainContent.innerHTML = html;
    } catch (error) {
        console.error('Detail error:', error);
        mainContent.innerHTML = `
            <div class="text-center py-20">
                <button onclick="loadHome()" class="text-gray-400 hover:text-white mb-6 flex items-center gap-2">
                    <i class="fas fa-arrow-left"></i> Kembali
                </button>
                <div class="bg-red-900/20 border border-red-800 rounded-xl p-6">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                    <h3 class="text-xl text-white mb-2">Gagal Memuat Detail</h3>
                    <p class="text-gray-400">Silakan coba lagi nanti</p>
                </div>
            </div>
        `;
    } finally {
        hideLoader();
    }
}

// 4. Video Player - SIMPLIFIED
async function playVideo(animeId, epsId, epsNumber) {
    showLoader();
    
    const modal = document.getElementById('video-modal');
    const video = document.getElementById('video-player');
    const title = document.getElementById('video-title');
    
    title.innerText = `Episode ${epsNumber}`;
    modal.classList.remove('hidden');
    
    try {
        const videoUrl = await api.getStreamUrl(animeId, epsId);
        
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
                    // Auto-play mungkin diblokir, tapi video sudah siap
                    console.log('Play blocked:', e);
                });
                hideLoader();
            });
            
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari
            video.src = videoUrl;
            video.addEventListener('loadedmetadata', () => {
                video.play();
                hideLoader();
            });
        } else {
            // Fallback
            video.src = videoUrl;
            video.load();
            hideLoader();
        }
        
    } catch (error) {
        console.error('Player error:', error);
        hideLoader();
        alert('Tidak dapat memutar video. Coba episode lain.');
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

// Component: Simple Card
function createCard(anime) {
    const id = anime.id || '1';
    const title = anime.title || 'Unknown';
    const cover = anime.cover || anime.image || 'https://via.placeholder.com/300x400/1a1a1a/ffffff?text=No+Image';
    const episode = anime.param || anime.episode || '';
    
    return `
        <div class="group cursor-pointer" onclick="loadDetail('${id}')">
            <div class="relative aspect-[3/4] overflow-hidden rounded-lg mb-3">
                <img src="${cover}" 
                     class="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                     onerror="this.src='https://via.placeholder.com/300x400/1a1a1a/ffffff?text=Error'">
                
                ${episode ? `
                <div class="absolute top-2 left-2">
                    <span class="text-xs bg-red-600 text-white px-2 py-1 rounded">
                        ${episode}
                    </span>
                </div>
                ` : ''}
                
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300">
                    <div class="absolute bottom-3 left-3 right-3">
                        <h3 class="text-white text-sm font-semibold line-clamp-2">${title}</h3>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Event listeners untuk form search
document.getElementById('search-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch(e);
    }
});

// Load home on start
document.addEventListener('DOMContentLoaded', loadHome);
