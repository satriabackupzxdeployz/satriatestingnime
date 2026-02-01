// js/app.js - SIMPLE WORKING VERSION
const api = new MobinimeAPI();
const mainContent = document.getElementById('main-content');
const loader = document.getElementById('loader');

function showLoader() {
    loader.classList.remove('hidden');
}

function hideLoader() {
    loader.classList.add('hidden');
}

// 1. LOAD HOME
async function loadHome() {
    showLoader();
    try {
        const response = await api.homepage();
        console.log('Home response:', response);
        
        let html = '<h2 class="text-2xl text-red-500 mb-4">Anime Terbaru</h2>';
        html += '<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">';
        
        // AMBIL DATA DARI RESPONSE
        let animeList = [];
        
        if (response?.data?.new_anime) {
            animeList = response.data.new_anime;
        } else if (response?.new_anime) {
            animeList = response.new_anime;
        } else if (Array.isArray(response)) {
            animeList = response;
        }
        
        if (animeList.length > 0) {
            animeList.forEach(anime => {
                const id = anime.id || anime.anime_id || '';
                const title = anime.title || anime.judul || '';
                const cover = anime.cover || anime.image || '';
                const episode = anime.param || anime.episode || '';
                
                html += `
                    <div class="cursor-pointer" onclick="loadDetail('${id}')">
                        <div class="relative">
                            <img src="${cover}" class="w-full h-48 object-cover rounded">
                            ${episode ? `<span class="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">${episode}</span>` : ''}
                        </div>
                        <h3 class="text-white text-sm mt-2 truncate">${title}</h3>
                    </div>
                `;
            });
        } else {
            html += '<p class="col-span-5 text-gray-400 text-center py-8">Tidak ada anime</p>';
        }
        
        html += '</div>';
        mainContent.innerHTML = html;
        
    } catch (error) {
        console.error('Load home error:', error);
        mainContent.innerHTML = `
            <div class="text-center py-10">
                <p class="text-red-500">Error: ${error.message}</p>
                <button onclick="loadHome()" class="bg-red-600 text-white px-4 py-2 rounded mt-4">Coba Lagi</button>
            </div>
        `;
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
        console.log('Search response:', response);
        
        let html = `<h2 class="text-xl text-white mb-4">Hasil: "${query}"</h2>`;
        html += '<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">';
        
        let results = [];
        if (response?.data) {
            results = response.data;
        } else if (Array.isArray(response)) {
            results = response;
        }
        
        if (results.length > 0) {
            results.forEach(anime => {
                const id = anime.id || anime.anime_id || '';
                const title = anime.title || anime.judul || '';
                const cover = anime.cover || anime.image || '';
                
                html += `
                    <div class="cursor-pointer" onclick="loadDetail('${id}')">
                        <img src="${cover}" class="w-full h-48 object-cover rounded">
                        <h3 class="text-white text-sm mt-2 truncate">${title}</h3>
                    </div>
                `;
            });
        } else {
            html += '<p class="col-span-5 text-gray-400 text-center py-8">Tidak ditemukan</p>';
        }
        
        html += '</div>';
        mainContent.innerHTML = html;
        
    } catch (error) {
        console.error('Search error:', error);
        alert('Gagal search: ' + error.message);
    } finally {
        hideLoader();
    }
}

// 3. DETAIL
async function loadDetail(id) {
    showLoader();
    try {
        const response = await api.detail(id);
        console.log('Detail response:', response);
        
        const anime = response?.data || response || {};
        
        let episodesHtml = '';
        const episodes = anime.list_episode || [];
        
        if (episodes.length > 0) {
            episodes.forEach(eps => {
                episodesHtml += `
                    <button onclick="playVideo('${anime.id}', '${eps.id || eps.episode}', '${eps.episode}')" 
                            class="bg-gray-800 hover:bg-red-600 text-white px-3 py-2 rounded">
                        ${eps.episode}
                    </button>
                `;
            });
        } else {
            episodesHtml = '<p class="text-gray-500">Tidak ada episode</p>';
        }
        
        const html = `
            <div class="bg-gray-900 p-4 rounded">
                <button onclick="loadHome()" class="text-white mb-4">← Kembali</button>
                
                <div class="md:flex gap-6">
                    <div class="md:w-1/3">
                        <img src="${anime.cover || anime.image}" class="w-full rounded">
                    </div>
                    <div class="md:w-2/3">
                        <h1 class="text-2xl text-red-500 font-bold">${anime.title || anime.judul}</h1>
                        <p class="text-gray-300 mt-4">${anime.synopsis || anime.description || ''}</p>
                        
                        <div class="mt-6">
                            <h3 class="text-xl text-white mb-3">Episode:</h3>
                            <div class="grid grid-cols-4 md:grid-cols-6 gap-2">
                                ${episodesHtml}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        mainContent.innerHTML = html;
        
    } catch (error) {
        console.error('Detail error:', error);
        alert('Gagal load detail: ' + error.message);
    } finally {
        hideLoader();
    }
}

// 4. PLAY VIDEO
async function playVideo(animeId, epsId, epsNumber) {
    showLoader();
    
    try {
        const videoUrl = await api.getStreamUrl(animeId, epsId);
        console.log('Video URL:', videoUrl);
        
        const modal = document.getElementById('video-modal');
        const video = document.getElementById('video-player');
        const title = document.getElementById('video-title');
        
        title.textContent = `Episode ${epsNumber}`;
        modal.classList.remove('hidden');
        
        // PLAY VIDEO
        if (Hls.isSupported()) {
            if (window.currentHls) {
                window.currentHls.destroy();
            }
            
            const hls = new Hls();
            window.currentHls = hls;
            
            hls.loadSource(videoUrl);
            hls.attachMedia(video);
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play();
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
        console.error('Play error:', error);
        hideLoader();
        alert('Gagal play video: ' + error.message);
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

// LOAD HOME ON START
loadHome();
