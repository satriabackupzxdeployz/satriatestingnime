// js/app.js

const api = new MobinimeAPI();
const mainContent = document.getElementById('main-content');
const loader = document.getElementById('loader');

// --- Utilities ---
const showLoader = () => loader.classList.remove('hidden');
const hideLoader = () => loader.classList.add('hidden');

const formatNumber = (num) => num ? num : '0';

// --- Views (Tampilan) ---

// 1. Render Home
async function loadHome() {
    showLoader();
    try {
        const data = await api.homepage();
        
        let html = `
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-red-500 mb-4 border-l-4 border-red-600 pl-3">Update Terbaru</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        `;

        if (data && data.new_anime) {
            data.new_anime.forEach(anime => {
                html += createCard(anime);
            });
        }
        
        html += `</div></div>`;
        mainContent.innerHTML = html;
    } catch (error) {
        mainContent.innerHTML = `<div class="text-center text-red-500 mt-10">Gagal memuat data. Coba refresh.<br><small>${error.message}</small></div>`;
    } finally {
        hideLoader();
    }
}

// 2. Render Search
async function handleSearch(event) {
    event.preventDefault();
    const query = document.getElementById('search-input').value;
    if (!query) return;

    showLoader();
    try {
        const data = await api.search(query);
        let html = `
            <div class="mb-6">
                <h2 class="text-xl text-white mb-4">Hasil pencarian: "${query}"</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        `;

        if (data && data.length > 0) {
            data.forEach(anime => html += createCard(anime));
        } else {
            html += `<p class="text-gray-400">Tidak ditemukan.</p>`;
        }

        html += `</div></div>`;
        mainContent.innerHTML = html;
    } catch (error) {
        alert("Error searching");
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
        
        // Generate Episode Buttons
        let epsButtons = '';
        if(anime.list_episode && anime.list_episode.length > 0) {
            // Sort episode dari kecil ke besar atau sebaliknya sesuai selera
            anime.list_episode.forEach(eps => {
                epsButtons += `
                    <button onclick="playVideo('${anime.id}', '${eps.id}', '${eps.episode}')" 
                        class="bg-gray-800 hover:bg-red-600 text-white text-sm py-2 px-3 rounded transition">
                        Eps ${eps.episode}
                    </button>
                `;
            });
        } else {
            epsButtons = '<p class="text-gray-500">Belum ada episode.</p>';
        }

        const html = `
            <div class="bg-[#1f1f1f] rounded-lg p-6 shadow-lg animate-fade-in">
                <button onclick="loadHome()" class="text-gray-400 hover:text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-arrow-left"></i> Kembali
                </button>

                <div class="flex flex-col md:flex-row gap-6">
                    <div class="w-full md:w-1/3 max-w-[300px] mx-auto">
                        <img src="${anime.cover}" class="w-full rounded-lg shadow-xl border border-gray-700">
                    </div>
                    <div class="flex-1 text-gray-200">
                        <h1 class="text-3xl font-bold text-red-500 mb-2">${anime.title}</h1>
                        <div class="flex flex-wrap gap-2 text-xs mb-4">
                            <span class="bg-gray-700 px-2 py-1 rounded">${anime.type}</span>
                            <span class="bg-gray-700 px-2 py-1 rounded">${anime.status}</span>
                            <span class="bg-gray-700 px-2 py-1 rounded"><i class="fas fa-star text-yellow-500"></i> ${anime.score || '-'}</span>
                        </div>
                        <p class="text-sm text-gray-400 leading-relaxed mb-4">${anime.synopsis}</p>
                        <p class="text-sm"><strong>Genre:</strong> ${anime.genre}</p>
                        
                        <div class="mt-6">
                            <h3 class="text-lg font-semibold border-b border-gray-700 pb-2 mb-3">Daftar Episode</h3>
                            <div class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scroll">
                                ${epsButtons}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        mainContent.innerHTML = html;
    } catch (error) {
        alert("Gagal memuat detail: " + error.message);
    } finally {
        hideLoader();
    }
}

// 4. Video Player Logic
async function playVideo(animeId, epsId, epsNumber) {
    showLoader();
    try {
        const url = await api.getStreamUrl(animeId, epsId);
        
        // Setup Modal Player
        const modal = document.getElementById('video-modal');
        const video = document.getElementById('video-player');
        const title = document.getElementById('video-title');
        
        title.innerText = `Menonton Episode ${epsNumber}`;
        modal.classList.remove('hidden');

        // Logic HLS.js
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
                video.play();
            });
            window.currentHls = hls; // Simpan instance agar bisa didestroy nanti
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Untuk Safari
            video.src = url;
            video.addEventListener('loadedmetadata', function() {
                video.play();
            });
        } else {
            alert("Browser Anda tidak support HLS.");
        }

    } catch (error) {
        alert("Gagal memutar video. Link stream mungkin mati/expired.");
        console.error(error);
    } finally {
        hideLoader();
    }
}

function closePlayer() {
    const modal = document.getElementById('video-modal');
    const video = document.getElementById('video-player');
    
    video.pause();
    video.src = '';
    if(window.currentHls) {
        window.currentHls.destroy();
    }
    modal.classList.add('hidden');
}

// Component: Card
function createCard(anime) {
    return `
        <div class="group cursor-pointer" onclick="loadDetail('${anime.id}')">
            <div class="relative aspect-[3/4] overflow-hidden rounded-lg mb-2">
                <img src="${anime.cover}" class="w-full h-full object-cover group-hover:scale-110 transition duration-300">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div class="absolute bottom-2 left-2 right-2">
                    <span class="text-xs bg-red-600 text-white px-1 rounded">${anime.param || 'EPS -'}</span>
                </div>
            </div>
            <h3 class="text-white text-sm font-semibold line-clamp-2 group-hover:text-red-500 transition">${anime.title}</h3>
        </div>
    `;
}

// Start
loadHome();