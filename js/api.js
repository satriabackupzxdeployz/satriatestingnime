// js/api.js - REAL WORKING VERSION
class MobinimeAPI {
    constructor() {
        // API utama
        this.mainApi = 'https://air.vunime.my.id/mobinime';
        // Backup API jika utama down
        this.backupApi = 'https://mobinime-api.alwaysdata.net/mobinime';
        
        this.currentApi = this.mainApi;
        this.isMainApiDown = false;
    }

    async _request(endpoint, data = {}) {
        // Coba API utama dulu, jika gagal coba backup
        try {
            return await this._tryRequest(this.currentApi, endpoint, data);
        } catch (error) {
            console.log(`API ${this.currentApi} failed, trying backup...`);
            
            // Switch ke backup API
            if (this.currentApi === this.mainApi) {
                this.currentApi = this.backupApi;
                this.isMainApiDown = true;
                return await this._tryRequest(this.currentApi, endpoint, data);
            } else {
                throw error;
            }
        }
    }

    async _tryRequest(apiUrl, endpoint, data) {
        const url = apiUrl + endpoint;
        
        // Convert data to FormData
        const formData = new FormData();
        for (const key in data) {
            formData.append(key, data[key]);
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'x-api-key': 'ThWmZq4t7w!z%C*F-JaNdRgUkXn2r5u8'
                },
                body: new URLSearchParams(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`API ${endpoint} success`);
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
            
            // Jika menggunakan backup API, log info
            if (this.isMainApiDown) {
                console.log('Using backup API for homepage');
            }
            
            return res;
        } catch (error) {
            throw new Error(`Homepage: ${error.message}`);
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
            throw new Error(`Search: ${error.message}`);
        }
    }

    async detail(id) {
        try {
            const res = await this._request('/anime/detail', {
                id: id
            });
            return res;
        } catch (error) {
            throw new Error(`Detail: ${error.message}`);
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
            
            // Ambil server URL
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
            } else if (videoRes?.data?.src) {
                return videoRes.data.src;
            } else {
                throw new Error('No video URL in response');
            }
            
        } catch (error) {
            console.error('Stream URL error:', error);
            throw error;
        }
    }

    // Test koneksi API
    async testConnection() {
        try {
            const response = await fetch(this.mainApi + '/pages/homepage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'x-api-key': 'ThWmZq4t7w!z%C*F-JaNdRgUkXn2r5u8'
                },
                body: new URLSearchParams({ perpage: '1', startpage: '0' })
            });
            
            return {
                status: response.status,
                ok: response.ok,
                api: 'Main API'
            };
        } catch (error) {
            console.log('Main API down, testing backup...');
            
            try {
                const backupResponse = await fetch(this.backupApi + '/pages/homepage', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'x-api-key': 'ThWmZq4t7w!z%C*F-JaNdRgUkXn2r5u8'
                    },
                    body: new URLSearchParams({ perpage: '1', startpage: '0' })
                });
                
                return {
                    status: backupResponse.status,
                    ok: backupResponse.ok,
                    api: 'Backup API'
                };
            } catch (backupError) {
                return {
                    status: 0,
                    ok: false,
                    api: 'Both APIs down',
                    error: backupError.message
                };
            }
        }
    }
}
