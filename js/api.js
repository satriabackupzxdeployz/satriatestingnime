// js/api.js

class MobinimeAPI {
    constructor() {
        // PROXY: Menggunakan corsproxy.io untuk bypass CORS block
        this.proxyUrl = 'https://corsproxy.io/?'; 
        this.baseUrl = 'https://air.vunime.my.id/mobinime';
        
        // Config Axios
        this.client = axios.create({
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                // API Key Wajib
                'x-api-key': 'ThWmZq4t7w!z%C*F-JaNdRgUkXn2r5u8' 
            }
        });
    }

    // Helper untuk membungkus request dengan Proxy
    async _request(method, endpoint, data = null) {
        // Encode URL target agar aman masuk ke URL Proxy
        const targetUrl = this.proxyUrl + encodeURIComponent(this.baseUrl + endpoint);

        const config = {
            method: method,
            url: targetUrl,
        };

        if (data) {
            // Konversi JSON object ke URLSearchParams (format form-urlencoded)
            const params = new URLSearchParams();
            for (const key in data) {
                params.append(key, data[key]);
            }
            config.data = params;
        }

        try {
            const response = await this.client(config);
            return response.data;
        } catch (error) {
            console.error(`Error pada ${endpoint}:`, error);
            throw error;
        }
    }

    async homepage() {
        const res = await this._request('GET', '/pages/homepage');
        return res.data;
    }

    async search(query) {
        const res = await this._request('POST', '/anime/search', {
            perpage: '30',
            startpage: '0',
            q: query
        });
        return res.data;
    }

    async detail(id) {
        const res = await this._request('POST', '/anime/detail', { id: id.toString() });
        return res.data;
    }

    async getStreamUrl(animeId, epsId) {
        // Tahap 1: Get Server List
        const srv = await this._request('POST', '/anime/get-server-list', {
            id: epsId.toString(),
            animeId: animeId.toString(),
            jenisAnime: '1',
            userId: ''
        });

        if (!srv.data || !srv.data.serverurl) throw new Error("Server tidak ditemukan");

        // Tahap 2: Get Real Video URL
        const vid = await this._request('POST', '/anime/get-url-video', {
            url: srv.data.serverurl,
            quality: 'HD',
            position: '0'
        });

        if (!vid.data || !vid.data.url) throw new Error("URL Video kosong");
        
        return vid.data.url;
    }
}