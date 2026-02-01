// js/app.js - FIXED VERSION

const api = new MobinimeAPI();
const mainContent = document.getElementById('main-content');
const loader = document.getElementById('loader');

// --- Utilities ---
const showLoader = () => loader.classList.remove('hidden');
const hideLoader = () => loader.classList.add('hidden');

// --- Views (Tampilan) ---

// 1. Render Home
async function loadHome() {
    showLoader();
    try {
        const response = await api.homepage();
        
        let html = `
            <div class="mb-8">
                <h2 class="text-2xl font-bold text-red-500 mb-6 border-l-4 border-red-600 pl-3">Update Terbaru</h2>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        `;

        // Handle berbagai format response
        let animeList = [];
        if (response && response.data && response.data.new_anime) {
            animeList = response.data.new_anime;
        } else if (response && response.new_anime) {
            animeList = response.new_anime;
        } else if (Array.isArray(response)) {
            animeList = response;
        }

        if (animeList && animeList.length > 0) {
            animeList.forEach(anime => {
                html += createCard(anime);
            });
        } else {
            html += `<p class="col-span-full text-center text-gray-400 py-8">Tidak ada anime terbaru</p>`;
        }
        
        html += `</div></div>`;
        mainContent.innerHTML = html;
    } catch (error) {
        console.error('Home Error:', error);
        mainContent.innerHTML = `
            <div class="text-center text-red-500 mt-10 p-4">
                <i class="fas fa-exclamation-triangle text-3xl mb-3"></i>
                <p>Gagal memuat data. Coba refresh halaman.</p>
                <small class="text-gray-500">${error.message || 'Unknown error'}</small>
            </div>`;
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
        
        let html = `
            <div class="mb-8">
                <button onclick="loadHome()" class="text-gray-400 hover:text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-arrow-left"></i> Kembali ke Beranda
                </button>
                <h2 class="text-xl font-bold text-white mb-6">Hasil pencarian: "${query}"</h2>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        `;

        // Handle response format
        let results = [];
        if (response && response.data) {
            results = response.data;
        } else if (Array.isArray(response)) {
            results = response;
        }

        if (results && results.length > 0) {
            results.forEach(anime => {
                html += createCard(anime);
            });
        } else {
            html += `<p class="col-span-full text-center text-gray-400 py-8">Tidak ditemukan anime dengan kata kunci "${query}"</p>`;
        }

        html += `</div></div>`;
        mainContent.innerHTML = html;
    } catch (error) {
        console.error('Search Error:', error);
        mainContent.innerHTML = `
            <div class="text-center text-red-500 mt-10">
                Gagal melakukan pencarian<br>
                <small>${error.message || 'Coba lagi nanti'}</small>
            </div>`;
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
        
        // Extract anime data
        const anime = response.data || response;
        
        if (!anime) {
            throw new Error('Data anime tidak ditemukan');
        }

        // Generate Episode Buttons
        let epsButtons = '';
        if(anime.list_episode && anime.list_episode.length > 0) {
            // Sort episode dari terbaru ke lama
            const sortedEpisodes = [...anime.list_episode].sort((a, b) => {
                return parseInt(b.episode) - parseInt(a.episode);
            });
            
            sortedEpisodes.forEach(eps => {
                epsButtons += `
                    <button onclick="playVideo('${anime.id}', '${eps.id}', '${eps.episode}')" 
                        class="bg-gray-800 hover:bg-red-600 text-white text-sm py-2 px-3 rounded transition duration-200 transform hover:scale-105">
                        ${eps.episode}
                    </button>
                `;
            });
        } else {
            epsButtons = '<p class="text-gray-500 col-span-full text-center">Belum ada episode.</p>';
        }

        const html = `
            <div class="bg-[#1a1a1a] rounded-xl p-4 md:p-6 shadow-2xl animate-fade-in">
                <button onclick="loadHome()" class="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition">
                    <i class="fas fa-arrow-left"></i> Kembali ke Beranda
                </button>

                <div class="flex flex-col lg:flex-row gap-6">
                    <!-- Poster -->
                    <div class="w-full lg:w-1/3 max-w-md mx-auto">
                        <div class="relative group">
                            <img src="${anime.cover || anime.image}" 
                                 alt="${anime.title}"
                                 class="w-full rounded-xl shadow-2xl border-2 border-gray-800 group-hover:border-red-600 transition duration-300">
                            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition duration-300"></div>
                        </div>
                        
                        <!-- Info Box -->
                        <div class="mt-4 bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div class="text-gray-400">Tipe</div>
                                <div class="text-white font-medium">${anime.type || '-'}</div>
                                
                                <div class="text-gray-400">Status</div>
                                <div class="text-white font-medium">${anime.status || '-'}</div>
                                
                                <div class="text-gray-400">Rating</div>
                                <div class="text-white font-medium">
                                    <i class="fas fa-star text-yellow-500 mr-1"></i>${anime.score || 'N/A'}
                                </div>
                                
                                <div class="text-gray-400">Genre</div>
                                <div class="text-white font-medium truncate">${anime.genre || '-'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Detail -->
                    <div class="flex-1">
                        <h1 class="text-2xl md:text-3xl lg:text-4xl font-bold text-red-500 mb-3">${anime.title}</h1>
                        
                        <!-- Synopsis -->
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-white mb-2">Sinopsis</h3>
                            <p class="text-gray-300 text-sm md:text-base leading-relaxed bg-gray-900/30 p-4 rounded-lg border border-gray-800">
                                ${anime.synopsis || anime.description || 'Tidak ada sinopsis tersedia.'}
                            </p>
                        </div>
                        
                        <!-- Episode List -->
                        <div class="mt-8">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-xl font-semibold text-white">Episode List</h3>
                                <span class="text-sm text-gray-400">${anime.list_episode ? anime.list_episode.length : 0} Episode</span>
                            </div>
                            <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
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
            <div class="text-center text-red-500 mt-10 p-6 bg-[#1a1a1a] rounded-xl">
                <i class="fas fa-times-circle text-4xl mb-4"></i>
                <p class="text-lg mb-2">Gagal memuat detail anime</p>
                <p class="text-sm text-gray-400">${error.message || 'Terjadi kesalahan'}</p>
                <button onclick="loadHome()" class="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded">
                    Kembali ke Beranda
                </button>
            </div>`;
    } finally {
        hideLoader();
    }
}

// 4. Video Player Logic - IMPROVED
async function playVideo(animeId, epsId, epsNumber) {
    showLoader();
    try {
        const videoUrl = await api.getStreamUrl(animeId, epsId);
        
        // Setup Modal Player
        const modal = document.getElementById('video-modal');
        const video = document.getElementById('video-player');
        const title = document.getElementById('video-title');
        
        title.innerText = `Episode ${epsNumber}`;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // HLS.js Configuration
        const config = {
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: 10,
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
        };

        // Clean up previous HLS instance
        if (window.currentHls) {
            window.currentHls.destroy();
        }

        // Play video
        if (Hls.isSupported()) {
            const hls = new Hls(config);
            window.currentHls = hls;
            
            hls.loadSource(videoUrl);
            hls.attachMedia(video);
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(e => {
                    console.log('Auto-play prevented:', e);
                    // User interaction might be required
                });
                hideLoader();
            });
            
            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch(data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log('Network error, trying to recover');
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log('Media error, recovering');
                            hls.recoverMediaError();
                            break;
                        default:
                            console.log('Fatal error, cannot recover');
                            hls.destroy();
                            showErrorPlayer();
                            break;
                    }
                }
            });
            
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // For Safari
            video.src = videoUrl;
            video.addEventListener('loadedmetadata', () => {
                video.play().catch(e => console.log('Safari play error:', e));
                hideLoader();
            });
        } else {
            // Fallback to native video if URL is direct .mp4
            if (videoUrl.includes('.mp4')) {
                video.src = videoUrl;
                video.load();
                hideLoader();
            } else {
                throw new Error("Browser tidak mendukung format streaming ini");
            }
        }

    } catch (error) {
        console.error('Player Error:', error);
        hideLoader();
        alert(`Gagal memutar video: ${error.message || 'Link stream mungkin tidak tersedia'}`);
        closePlayer();
    }
}

function showErrorPlayer() {
    const modal = document.getElementById('video-modal');
    const title = document.getElementById('video-title');
    title.innerText = 'Error: Gagal memuat video';
    setTimeout(() => {
        closePlayer();
        alert('Video tidak dapat diputar. Coba episode lain atau coba lagi nanti.');
    }, 2000);
}

function closePlayer() {
    const modal = document.getElementById('video-modal');
    const video = document.getElementById('video-player');
    
    video.pause();
    video.src = '';
    
    if(window.currentHls) {
        window.currentHls.destroy();
        window.currentHls = null;
    }
    
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    hideLoader();
}

// Component: Card - IMPROVED
function createCard(anime) {
    // Fallback untuk data yang tidak lengkap
    const animeId = anime.id || anime.anime_id || '';
    const title = anime.title || anime.judul || 'Tanpa Judul';
    const cover = anime.cover || anime.image || anime.thumbnail || 'https://via.placeholder.com/300x400/1a1a1a/ffffff?text=No+Image';
    const episode = anime.param || anime.episode || anime.eps || '';
    
    return `
        <div class="group cursor-pointer transform transition duration-300 hover:scale-[1.02]" onclick="loadDetail('${animeId}')">
            <div class="relative aspect-[3/4] overflow-hidden rounded-xl mb-3 shadow-lg">
                <img src="${cover}" 
                     alt="${title}"
                     class="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                     onerror="this.src='https://via.placeholder.com/300x400/1a1a1a/ffffff?text=No+Image'">
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300"></div>
                
                <!-- Episode Badge -->
                ${episode ? `
                <div class="absolute top-2 left-2">
                    <span class="text-xs bg-red-600 text-white px-2 py-1 rounded-md font-semibold">
                        ${episode}
                    </span>
                </div>
                ` : ''}
                
                <!-- Play Button Overlay -->
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                    <div class="bg-red-600/90 w-12 h-12 rounded-full flex items-center justify-center transform group-hover:scale-110 transition duration-300">
                        <i class="fas fa-play text-white"></i>
                    </div>
                </div>
            </div>
            <h3 class="text-white text-sm font-semibold line-clamp-2 group-hover:text-red-400 transition duration-200 px-1">
                ${title}
            </h3>
            ${anime.score ? `
            <div class="flex items-center gap-1 mt-1 px-1">
                <i class="fas fa-star text-yellow-500 text-xs"></i>
                <span class="text-xs text-gray-400">${anime.score}</span>
            </div>
            ` : ''}
        </div>
    `;
}

// Event Listener untuk keyboard shortcuts
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('video-modal');
    if (!modal.classList.contains('hidden')) {
        if (e.key === 'Escape') {
            closePlayer();
        }
        if (e.key === ' ') {
            e.preventDefault();
            const video = document.getElementById('video-player');
            video.paused ? video.play() : video.pause();
        }
    }
});

// Auto-focus search input when pressing Ctrl+K
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input').focus();
    }
});

// Start the app
document.addEventListener('DOMContentLoaded', () => {
    // Load homepage after a short delay to ensure everything is ready
    setTimeout(() => {
        loadHome();
    }, 100);
});
