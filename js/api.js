// js/api.js - WORKING VERSION
class MobinimeAPI {
    constructor() {
        this.baseUrl = 'https://air.vunime.my.id/mobinime';
    }

    async _request(endpoint, data = {}) {
        const url = this.baseUrl + endpoint;
        
        const formData = new URLSearchParams();
        for (const key in data) {
            formData.append(key, data[key]);
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'x-api-key': 'ThWmZq4t7w!z%C*F-JaNdRgUkXn2r5u8'
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`API ${endpoint} success:`, result);
            return result;
            
        } catch (error) {
            console.error(`API ${endpoint} failed:`, error);
            throw error;
        }
    }

    async homepage() {
        try {
            const res = await this._request('/pages/homepage', {
                perpage: '20',
                startpage: '0'
            });
            return res;
        } catch (error) {
            console.error('homepage error:', error);
            throw error;
        }
    }

    async search(query) {
        try {
            const res = await this._request('/anime/search', {
                perpage: '30',
                startpage: '0',
                q: query
            });
            return res;
        } catch (error) {
            console.error('search error:', error);
            throw error;
        }
    }

    async detail(id) {
        try {
            const res = await this._request('/anime/detail', {
                id: id
            });
            return res;
        } catch (error) {
            console.error('detail error:', error);
            throw error;
        }
    }

    async getStreamUrl(animeId, epsId) {
        try {
            // Step 1: Get server list
            const serverRes = await this._request('/anime/get-server-list', {
                id: epsId,
                animeId: animeId,
                jenisAnime: '1',
                userId: '0'
            });
            
            console.log('Server response:', serverRes);
            
            let serverUrl = null;
            
            // Get first available server
            if (serverRes?.data?.serverurl) {
                serverUrl = serverRes.data.serverurl;
            } else if (serverRes?.data?.list_server?.[0]?.link) {
                serverUrl = serverRes.data.list_server[0].link;
            }
            
            if (!serverUrl) {
                throw new Error('Tidak ada server tersedia');
            }
            
            console.log('Server URL:', serverUrl);
            
            // Step 2: Get video URL
            const videoRes = await this._request('/anime/get-url-video', {
                url: serverUrl,
                quality: 'HD',
                position: '0'
            });
            
            console.log('Video response:', videoRes);
            
            if (videoRes?.data?.url) {
                return videoRes.data.url;
            } else if (videoRes?.url) {
                return videoRes.url;
            } else {
                throw new Error('URL video tidak ditemukan');
            }
            
        } catch (error) {
            console.error('getStreamUrl error:', error);
            throw error;
        }
    }
}
