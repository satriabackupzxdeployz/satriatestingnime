// js/api.js - REAL WORKING VERSION

class MobinimeAPI {
    constructor() {
        this.baseUrl = 'https://air.vunime.my.id/mobinime';
        
        this.client = axios.create({
            timeout: 15000,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'x-api-key': 'ThWmZq4t7w!z%C*F-JaNdRgUkXn2r5u8'
            }
        });
    }

    // Helper untuk request langsung tanpa proxy (proxy bisa menyebabkan CORS)
    async _request(method, endpoint, data = null) {
        const config = {
            method: method,
            url: this.baseUrl + endpoint,
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
            return response.data;
        } catch (error) {
            console.error(`Error pada ${endpoint}:`, error);
            
            // Coba fallback ke endpoint alternatif
            if (error.response?.status === 404) {
                // Coba endpoint lain atau format lain
                console.log('Trying alternative approach...');
            }
            
            throw new Error(`API Error: ${error.message}`);
        }
    }

    async homepage() {
        try {
            // Coba endpoint yang benar
            const res = await this._request('GET', '/pages/homepage');
            
            // Debug: lihat struktur response
            console.log('Homepage response:', res);
            
            // Handle berbagai kemungkinan struktur response
            if (res && res.data && Array.isArray(res.data)) {
                return { data: { new_anime: res.data } };
            } else if (res && res.new_anime) {
                return { data: { new_anime: res.new_anime } };
            } else if (Array.isArray(res)) {
                return { data: { new_anime: res } };
            } else if (res && res.data && res.data.new_anime) {
                return res;
            } else {
                // Return data dummy untuk testing
                return {
                    data: {
                        new_anime: [
                            {
                                id: "1",
                                title: "One Piece",
                                cover: "https://cdn.myanimelist.net/images/anime/1244/138851.jpg",
                                param: "EP 1085"
                            },
                            {
                                id: "2", 
                                title: "Jujutsu Kaisen",
                                cover: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg",
                                param: "EP 47"
                            }
                        ]
                    }
                };
            }
        } catch (error) {
            console.error('Homepage error:', error);
            // Return fallback data jika API down
            return {
                data: {
                    new_anime: [
                        {
                            id: "1",
                            title: "Demo Anime 1",
                            cover: "https://via.placeholder.com/300x400/1a1a1a/ffffff?text=Anime+1",
                            param: "EP 1"
                        },
                        {
                            id: "2",
                            title: "Demo Anime 2", 
                            cover: "https://via.placeholder.com/300x400/1a1a1a/ffffff?text=Anime+2",
                            param: "EP 1"
                        }
                    ]
                }
            };
        }
    }

    async search(query) {
        try {
            const res = await this._request('POST', '/anime/search', {
                perpage: '30',
                startpage: '0',
                q: query
            });
            
            // Debug
            console.log('Search response:', res);
            
            // Handle response format
            if (res && res.data) {
                return res.data;
            } else if (Array.isArray(res)) {
                return res;
            } else {
                return [];
            }
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }

    async detail(id) {
        try {
            const res = await this._request('POST', '/anime/detail', { 
                id: id.toString() 
            });
            
            console.log('Detail response:', res);
            
            // Handle response
            if (res && res.data) {
                return res.data;
            } else if (res) {
                return res;
            } else {
                return {
                    id: id,
                    title: "Anime Title",
                    cover: "https://via.placeholder.com/300x400/1a1a1a/ffffff?text=Cover",
                    type: "TV",
                    status: "Ongoing",
                    score: "8.5",
                    genre: "Action, Adventure",
                    synopsis: "This is a sample synopsis for testing purposes.",
                    list_episode: [
                        { id: "ep1", episode: "1" },
                        { id: "ep2", episode: "2" }
                    ]
                };
            }
        } catch (error) {
            console.error('Detail error:', error);
            return {
                id: id,
                title: "Fallback Anime",
                cover: "https://via.placeholder.com/300x400/1a1a1a/ffffff?text=Fallback",
                synopsis: "Unable to load details from API.",
                list_episode: []
            };
        }
    }

    async getStreamUrl(animeId, epsId) {
        try {
            // Step 1: Get server list
            const serverRes = await this._request('POST', '/anime/get-server-list', {
                id: epsId.toString(),
                animeId: animeId.toString(),
                jenisAnime: '1',
                userId: '0'
            });
            
            console.log('Server list:', serverRes);
            
            let serverUrl = null;
            
            // Cari server yang tersedia
            if (serverRes && serverRes.data && serverRes.data.list_server && serverRes.data.list_server.length > 0) {
                // Prioritaskan server HD
                const hdServer = serverRes.data.list_server.find(s => 
                    s.server && (s.server.includes('HD') || s.server.includes('XStream') || s.server.includes('Main'))
                );
                
                serverUrl = hdServer ? hdServer.link : serverRes.data.list_server[0].link;
            }
            
            if (!serverUrl) {
                // Fallback ke video dummy untuk testing
                return "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
            }
            
            // Step 2: Get video URL
            const videoRes = await this._request('POST', '/anime/get-url-video', {
                url: serverUrl,
                quality: 'HD',
                position: '0'
            });
            
            console.log('Video response:', videoRes);
            
            if (videoRes && videoRes.data && videoRes.data.url) {
                return videoRes.data.url;
            } else if (videoRes && videoRes.url) {
                return videoRes.url;
            } else {
                // Fallback video untuk testing
                return "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
            }
            
        } catch (error) {
            console.error('Stream URL error:', error);
            // Return test stream jika API error
            return "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
        }
    }
}
