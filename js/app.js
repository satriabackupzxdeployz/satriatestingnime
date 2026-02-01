// js/app.js - REAL API HANDLER

const api = new MobinimeAPI();
const mainContent = document.getElementById('main-content');
const loader = document.getElementById('loader');

// --- Utilities ---
const showLoader = () => {
    loader.classList.remove('hidden');
    mainContent.style.opacity = '0.5';
};

const hideLoader = () => {
    loader.classList.add('hidden');
    mainContent.style.opacity = '1';
};

// --- Views ---

// 1. Render Home - Handle response struktur API sebenarnya
async function loadHome() {
    showLoader();
    try {
        const response = await api.homepage();
        
        console.log('Homepage Data Structure:', response);
        
        let html = `
            <div class="mb-8">
                <h2 class="text-2xl font-bold text-red-500 mb-6 border-l-4 border-red-600 pl-3">Update Terbaru</h2>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        `;

        // LOGIKA UNTUK MENGAMBIL DATA DARI RESPONSE API
        let animeList = [];
        
        // Coba semua kemungkinan struktur response
        if (response?.data?.new_anime) {
            animeList = response.data.new_anime;
        } else if (response?.new_anime) {
            animeList = response.new_anime;
        } else if (response?.data && Array.isArray(response.data)) {
            animeList = response.data;
        } else if (Array.isArray(response)) {
            animeList = response;
        } else if (response?.data?.data?.new_anime) {
            animeList = response.data.data.new_anime;
        }
        
        console.log('Extracted anime list:', animeList);
        
        if (animeList && animeList.length > 0) {
            animeList.forEach((anime, index) => {
                // Pastikan anime punya minimal ID
                if (!anime.id && anime.anime_id) {
                    anime.id = anime.anime_id;
                }
                if (!anime.id) {
                    anime.id = 'temp_' + index;
                }
                
                html += createCard(anime);
            });
        } else {
            html += `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-exclamation-circle text-4xl text-gray-600 mb-3"></i>
                    <p class="text-gray-400">Data anime tidak ditemukan</p>
                    <p class="text-xs text-gray-600 mt-2">Response API: ${JSON.stringify(response).substring(0, 200)}...</p>
                    <button onclick="testAPI()" class="mt-4 text-sm text-red-500 hover:text-red-400">
                        <i class="fas fa-bug mr-1"></i>Test API Response
                    </button>
                </div>
            `;
        }
        
        html += `</div></div>`;
        mainContent.innerHTML = html;
    } catch (error) {
        console.error('Home Error:', error);
        mainContent.innerHTML = `
            <div class="text-center py-16">
                <div class="bg-gray-900/50 rounded-xl p-6 max-w-md mx-auto">
                    <i class="fas fa-plug text-4xl text-red-500 mb-4"></i>
                    <h3 class="text-xl text-white mb-2">API Connection Error</h3>
                    <p class="text-gray-400 mb-4">${error.message || 'Cannot connect to API server'}</p>
                    <div class="text-left bg-black/30 p-4 rounded-lg mb-4">
                        <p class="text-sm text-gray-500">Troubleshooting:</p>
                        <ul class="text-xs text-gray-400 list-disc list-inside mt-2">
                            <li>Cek koneksi internet</li>
                            <li>API mungkin sedang maintenance</li>
                            <li>Coba refresh halaman</li>
                        </ul>
                    </div>
                    <button onclick="loadHome()" class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg">
                        <i class="fas fa-redo mr-2"></i>Coba Lagi
                    </button>
                </div>
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
        const response = await api.search(query);
        
        console.log('Search Response:', response);
        
        let html = `
            <div class="mb-8">
                <button onclick="loadHome()" class="text-gray-400 hover:text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-arrow-left"></i> Kembali ke Beranda
                </button>
                <h2 class="text-xl font-bold text-white mb-6">Hasil pencarian: "${query}"</h2>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        `;

        // Handle search response
        let searchResults = [];
        
        if (response?.data) {
            searchResults = response.data;
        } else if (Array.isArray(response)) {
            searchResults = response;
        } else if (response?.results) {
            searchResults = response.results;
        }
        
        if (searchResults && searchResults.length > 0) {
            searchResults.forEach((anime, index) => {
                if (!anime.id && anime.anime_id) {
                    anime.id = anime.anime_id;
                }
                if (!anime.id) {
                    anime.id = 'search_' + index;
                }
                html += createCard(anime);
            });
        } else {
            html += `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-search text-4xl text-gray-600 mb-3"></i>
                    <p class="text-gray-400">Tidak ditemukan anime dengan kata kunci "${query}"</p>
                </div>
            `;
        }

        html += `</div></div>`;
        mainContent.innerHTML = html;
    } catch (error) {
        console.error('Search Error:', error);
        mainContent.innerHTML = `
            <div class="text-center py-10">
                <p class="text-red-500">Gagal melakukan pencarian: ${error.message}</p>
                <button onclick="loadHome()" class="mt-4 text-gray-400 hover:text-white">
                    <i class="fas fa-arrow-left mr-2"></i>Kembali
                </button>
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
        const response = await api.detail(id);
        
        console.log('Detail Response:', response);
        
        // Extract anime data dari response
        const anime = response?.data || response;
        
        if (!anime) {
            throw new Error('Detail data tidak ditemukan');
        }
        
        // Generate episode buttons
        let epsButtons = '';
        const episodes = anime.list_episode || anime.episodes || [];
        
        if (episodes.length > 0) {
            // Sort dari episode terbaru
            episodes.sort((a, b) => {
                const epA = parseInt(a.episode || a.eps || 0);
                const epB = parseInt(b.episode || b.eps || 0);
                return epB - epA;
            });
            
            episodes.forEach(eps => {
                const epId = eps.id || eps.episode_id || eps.episode;
                const epNum = eps.episode || eps.eps || '';
                epsButtons += `
                    <button onclick="playVideo('${anime.id || id}', '${epId}', '${epNum}')" 
                        class="bg-gray-800 hover:bg-red-600 text-white text-sm py-2 px-3 rounded transition">
                        ${epNum}
                    </button>
                `;
            });
        } else {
            epsButtons = '<p class="text-gray-500 col-span-full text-center py-4">Belum ada episode.</p>';
        }

        const html = `
            <div class="bg-[#1a1a1a] rounded-xl p-4 md:p-6">
                <button onclick="loadHome()" class="text-gray-400 hover:text-white mb-6 flex items-center gap-2">
                    <i class="fas fa-arrow-left"></i> Kembali ke Beranda
                </button>

                <div class="flex flex-col lg:flex-row gap-6">
                    <!-- Poster -->
                    <div class="w-full lg:w-1/3 max-w-md">
                        <img src="${anime.cover || anime.image || anime.thumbnail}" 
                             alt="${anime.title}"
                             class="w-full rounded-xl shadow-lg"
                             onerror="this.src='https://via.placeholder.com/300x400/1a1a1a/ffffff?text=No+Image'">
                    </div>
                    
                    <!-- Detail -->
                    <div class="flex-1">
                        <h1 class="text-2xl md:text-3xl font-bold text-red-500 mb-3">${anime.title || anime.judul || 'Unknown Title'}</h1>
                        
                        <!-- Info Tags -->
                        <div class="flex flex-wrap gap-2 mb-4">
                            ${anime.type ? `<span class="bg-gray-800 px-3 py-1 rounded text-sm">${anime.type}</span>` : ''}
                            ${anime.status ? `<span class="bg-gray-800 px-3 py-1 rounded text-sm">${anime.status}</span>` : ''}
                            ${anime.score ? `<span class="bg-gray-800 px-3 py-1 rounded text-sm"><i class="fas fa-star text-yellow-500 mr-1"></i>${anime.score}</span>` : ''}
                        </div>
                        
                        <!-- Synopsis -->
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-white mb-2">Sinopsis</h3>
                            <p class="text-gray-300 leading-relaxed">${anime.synopsis || anime.description || 'Tidak ada sinopsis tersedia.'}</p>
                        </div>
                        
                        <!-- Additional Info -->
                        ${anime.genre ? `
                        <div class="mb-4">
                            <p class="text-gray-400"><strong class="text-white">Genre:</strong> ${anime.genre}</p>
                        </div>
                        ` : ''}
                        
                        ${anime.released ? `
                        <div class="mb-4">
                            <p class="text-gray-400"><strong class="text-white">Released:</strong> ${anime.released}</p>
                        </div>
                        ` : ''}
                        
                        <!-- Episode List -->
                        <div class="mt-8">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-xl font-semibold text-white">Daftar Episode (${episodes.length})</h3>
                            </div>
                            <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[500px] overflow-y-auto pr-2">
                                ${epsButtons}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        mainContent.innerHTML = html;
    } catch (error) {
        console.error('Detail Error:', error);
        mainContent.innerHTML = `
            <div class="text-center py-16">
                <div class="bg-gray-900/50 rounded-xl p-6 max-w-md mx-auto">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                    <h3 class="text-xl text-white mb-2">Gagal Memuat Detail</h3>
                    <p class="text-gray-400 mb-4">${error.message || 'Terjadi kesalahan'}</p>
                    <button onclick="loadHome()" class="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg">
                        <i class="fas fa-arrow-left mr-2"></i>Kembali ke Beranda
                    </button>
                </div>
            </div>
        `;
    } finally {
        hideLoader();
    }
}

// 4. Video Player
async function playVideo(animeId, epsId, epsNumber) {
    showLoader();
    
    const modal = document.getElementById('video-modal');
    const video = document.getElementById('video-player');
    const title = document.getElementById('video-title');
    
    title.innerText = `Episode ${epsNumber}`;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    try {
        const videoUrl = await api.getStreamUrl(animeId, epsId);
        
        console.log('Video URL:', videoUrl);
        
        // HLS.js Support
        if (Hls.isSupported()) {
            // Destroy previous instance
            if (window.currentHls) {
                window.currentHls.destroy();
            }
            
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90
            });
            
            window.currentHls = hls;
            
            hls.loadSource(videoUrl);
            hls.attachMedia(video);
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(e => {
                    console.log('Auto-play prevented, waiting for user interaction');
                });
                hideLoader();
            });
            
            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS Error:', data);
                if (data.fatal) {
                    switch(data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            hideLoader();
                            alert('Error memutar video. Coba episode lain.');
                            closePlayer();
                            break;
                    }
                }
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
        console.error('Player Error:', error);
        hideLoader();
        alert(`Gagal memutar video: ${error.message}`);
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
    document.body.style.overflow = 'auto';
}

// Component: Card
function createCard(anime) {
    const id = anime.id || anime.anime_id || '1';
    const title = anime.title || anime.judul || 'Unknown Title';
    const cover = anime.cover || anime.image || anime.thumbnail || 'https://via.placeholder.com/300x400/1a1a1a/ffffff?text=No+Image';
    const episode = anime.param || anime.episode || anime.eps || '';
    
    return `
        <div class="group cursor-pointer transform transition-transform duration-200 hover:scale-[1.02]" 
             onclick="loadDetail('${id}')">
            <div class="relative aspect-[3/4] overflow-hidden rounded-lg mb-3 shadow-lg">
                <img src="${cover}" 
                     alt="${title}"
                     class="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                     onerror="this.src='https://via.placeholder.com/300x400/1a1a1a/ffffff?text=Error'">
                
                <!-- Episode Badge -->
                ${episode ? `
                <div class="absolute top-2 left-2">
                    <span class="text-xs bg-red-600 text-white px-2 py-1 rounded font-semibold">
                        ${episode}
                    </span>
                </div>
                ` : ''}
                
                <!-- Hover Overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300">
                    <div class="absolute bottom-3 left-3 right-3">
                        <h3 class="text-white text-sm font-semibold line-clamp-2">${title}</h3>
                        <div class="flex items-center mt-1 opacity-0 group-hover:opacity-100 transition duration-300">
                            <span class="text-xs text-gray-300">Klik untuk detail</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Test function untuk debugging API
async function testAPI() {
    try {
        showLoader();
        const test = await api.homepage();
        console.log('API Test Result:', test);
        alert(`API Test Success!\nResponse structure:\n${JSON.stringify(test, null, 2).substring(0, 500)}...`);
    } catch (error) {
        console.error('API Test Error:', error);
        alert(`API Test Failed:\n${error.message}`);
    } finally {
        hideLoader();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load homepage
    loadHome();
    
    // Search on Enter
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch(e);
            }
        });
    }
    
    // Close modal on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('video-modal');
            if (!modal.classList.contains('hidden')) {
                closePlayer();
            }
        }
    });
});
