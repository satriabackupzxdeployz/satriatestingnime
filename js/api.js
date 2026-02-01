// js/api.js - REAL API VERSION

class MobinimeAPI {
    constructor() {
        this.baseUrl = 'https://air.vunime.my.id/mobinime';
        
        this.client = axios.create({
            timeout: 30000,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'x-api-key': 'ThWmZq4t7w!z%C*F-JaNdRgUkXn2r5u8',
                'Origin': 'https://air.vunime.my.id',
                'Referer': 'https://air.vunime.my.id/'
            }
        });
    }

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
            console.log(`API ${endpoint} Response:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`API Error ${endpoint}:`, error);
            console.error('Error details:', error.response?.data);
            throw error;
        }
    }

    async homepage() {
        try {
            // Endpoint yang benar untuk homepage
            const res = await this._request('POST', '/pages/homepage', {
                perpage: '20',
                startpage: '0'
            });
            
            // Debug log
            console.log('Homepage RAW response:', res);
            
            if (!res) {
                throw new Error('No response from API');
            }
            
            return res;
        } catch (error) {
            console.error('Homepage API Error:', error);
            throw new Error(`Failed to load homepage: ${error.message}`);
        }
    }

    async search(query) {
        try {
            const res = await this._request('POST', '/anime/search', {
                perpage: '30',
                startpage: '0',
                q: query
            });
            
            if (!res) {
                throw new Error('No search results');
            }
            
            return res;
        } catch (error) {
            console.error('Search API Error:', error);
            throw new Error(`Search failed: ${error.message}`);
        }
    }

    async detail(id) {
        try {
            const res = await this._request('POST', '/anime/detail', { 
                id: id.toString() 
            });
            
            if (!res) {
                throw new Error('No detail data');
            }
            
            return res;
        } catch (error) {
            console.error('Detail API Error:', error);
            throw new Error(`Failed to load detail: ${error.message}`);
        }
    }

    async getStreamUrl(animeId, epsId) {
        try {
            // Step 1: Get server list - format yang benar
            const serverRes = await this._request('POST', '/anime/get-server-list', {
                id: epsId.toString(),
                animeId: animeId.toString(),
                jenisAnime: '1',
                userId: '0'
            });
            
            console.log('Server Response:', serverRes);
            
            // Ambil server URL dari response
            let serverUrl = null;
            if (serverRes?.data?.serverurl) {
                serverUrl = serverRes.data.serverurl;
            } else if (serverRes?.data?.list_server?.[0]?.link) {
                serverUrl = serverRes.data.list_server[0].link;
            } else if (serverRes?.serverurl) {
                serverUrl = serverRes.serverurl;
            }
            
            if (!serverUrl) {
                throw new Error('No server URL found');
            }
            
            console.log('Using server URL:', serverUrl);
            
            // Step 2: Get video URL
            const videoRes = await this._request('POST', '/anime/get-url-video', {
                url: serverUrl,
                quality: 'HD',
                position: '0'
            });
            
            console.log('Video Response:', videoRes);
            
            // Ambil video URL dari response
            let videoUrl = null;
            if (videoRes?.data?.url) {
                videoUrl = videoRes.data.url;
            } else if (videoRes?.url) {
                videoUrl = videoRes.url;
            } else if (videoRes?.data?.src) {
                videoUrl = videoRes.data.src;
            }
            
            if (!videoUrl) {
                throw new Error('No video URL found');
            }
            
            return videoUrl;
            
        } catch (error) {
            console.error('Stream API Error:', error);
            throw new Error(`Failed to get stream URL: ${error.message}`);
        }
    }
}
