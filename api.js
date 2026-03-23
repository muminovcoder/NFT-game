const API = {
    baseURL: 'https://api.telegram.bots/game-bot',
    requestTimeout: 15000,
    retryAttempts: 3,
    throttleDelay: 500,
    lastRequestTime: 0,

    async request(endpoint, data = {}, retryCount = 0) {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.throttleDelay) {
            await this.delay(this.throttleDelay - timeSinceLastRequest);
        }
        
        this.lastRequestTime = Date.now();
        
        try {
            const response = await Promise.race([
                fetch(`${this.baseURL}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Telegram-Init-Data': window.Telegram?.WebApp?.initData || ''
                    },
                    body: JSON.stringify(data)
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Request timeout')), this.requestTimeout)
                )
            ]);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.message || 'API Error');
            }

            return result;
        } catch (error) {
            if (retryCount < this.retryAttempts && this.isRetryableError(error)) {
                await this.delay(1000 * Math.pow(2, retryCount));
                return this.request(endpoint, data, retryCount + 1);
            }
            throw error;
        }
    },

    isRetryableError(error) {
        return error.message.includes('timeout') || 
               error.message.includes('network') ||
               error.status === 429 ||
               error.status >= 500;
    },

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    async getUser() {
        return this.request('/getUser');
    },

    async getUserStats() {
        return this.request('/getUserStats');
    },

    async openPack(packType) {
        return this.request('/openPack', { packType });
    },

    async getCollection(filters = {}) {
        return this.request('/getCollection', filters);
    },

    async startBattle(cardIds) {
        return this.request('/startBattle', { cardIds });
    },

    async getMarketplace(page = 1) {
        return this.request('/getMarketplace', { page });
    },

    async listCard(cardId, price) {
        return this.request('/listCard', { cardId, price });
    },

    async buyCard(cardId) {
        return this.request('/buyCard', { cardId });
    },

    async cancelListing(cardId) {
        return this.request('/cancelListing', { cardId });
    },

    async claimDailyBonus() {
        return this.request('/claimDailyBonus');
    },

    async getReferralInfo() {
        return this.request('/getReferralInfo');
    },

    async requestWithdraw(amount, cardNumber, fullName) {
        return this.request('/requestWithdraw', {
            amount,
            cardNumber,
            fullName
        });
    },

    async getWithdrawHistory() {
        return this.request('/getWithdrawHistory');
    },

    async getPackPrices() {
        return this.request('/getPackPrices');
    },

    async getTransactionHistory() {
        return this.request('/getTransactionHistory');
    }
};

window.API = API;
