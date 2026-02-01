// js/api.js - FIXED VERSION

class MobinimeAPI {
    constructor() {
        // PROXY: Menggunakan alternatif CORS proxy yang lebih stabil
        this.proxyUrl = 'https://api.allorigins.win/raw?url=';
        this.baseUrl = 'https://air.vunime.my.id/mobinime';
        
        // Config Axios
        this.client = axios.create({
            timeout: 30000,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'x-api-key': 'ThWmZq4t7w!z%C*F-JaNdRgUkXn2r5u8'
            }
        });
    }

    // Helper untuk membungkus request dengan Proxy
    async _request(method, endpoint, data = null) {
        const targetUrl = this.proxyUrl + encodeURIComponent(this.baseUrl + endpoint);

        const config = {
            method: method,
            url: targetUrl,
        };

        if (data) {
            const params = new URLSearchParams();
            for (const key in data) {
                if (data[key] !== null && data[key] !== undefined) {
                    params.append(key, data[key]);
                }
            }
            config.data = params;
        }

        try {
            const response = await this.client(config);
            
            // Handle jika response adalah string JSON
            if (typeof response.data === 'string') {
                try {
                    return JSON.parse(response.data);
                } catch (e) {
                    return response.data;
                }
            }
            
            return response.data;
        } catch (error) {
            console.error(`Error pada ${endpoint}:`, error);
            throw new Error(`API Error: ${error.message}`);
        }
    }

    async homepage() {
        const res = await this._request('POST', '/pages/homepage', {
            perpage: '20',
            startpage: '0'
        });
        return res;
    }

    async search(query) {
        const res = await this._request('POST', '/anime/search', {
            perpage: '30',
            startpage: '0',
            q: query
        });
        return res;
    }

    async detail(id) {
        const res = await this._request('POST', '/anime/detail', { 
            id: id.toString() 
        });
        return res;
    }

    async getStreamUrl(animeId, epsId) {
        try {
            // Tahap 1: Get Server List
            const srv = await this._request('POST', '/anime/get-server-list', {
                id: epsId.toString(),
                animeId: animeId.toString(),
                jenisAnime: '1',
                userId: '0'
            });

            // Debug: Lihat struktur response
            console.log('Server Response:', srv);

            // Cari server yang tersedia (prioritaskan XStreamCDN atau server HD)
            let serverUrl = null;
            if (srv.data && srv.data.list_server) {
                // Cari server dengan kualitas terbaik
                const preferredServers = ['XStreamCDN', 'HD', 'SD'];
                for (const server of preferredServers) {
                    const found = srv.data.list_server.find(s => 
                        s.server && s.server.includes(server)
                    );
                    if (found && found.link) {
                        serverUrl = found.link;
                        break;
                    }
                }
                
                // Jika tidak ditemukan, ambil server pertama
                if (!serverUrl && srv.data.list_server[0] && srv.data.list_server[0].link) {
                    serverUrl = srv.data.list_server[0].link;
                }
            }

            if (!serverUrl) {
                throw new Error("Tidak ada server yang tersedia");
            }

            console.log('Selected Server URL:', serverUrl);

            // Tahap 2: Get Real Video URL
            const vid = await this._request('POST', '/anime/get-url-video', {
                url: serverUrl,
                quality: 'HD',
                position: '0'
            });

            console.log('Video Response:', vid);

            if (vid.data && vid.data.url) {
                return vid.data.url;
            } else if (vid.data && vid.data.src) {
                return vid.data.src;
            } else if (vid.url) {
                return vid.url;
            } else {
                throw new Error("URL video tidak ditemukan dalam response");
            }

        } catch (error) {
            console.error('Error getting stream URL:', error);
            throw error;
        }
    }
}
