const MockAPI = {
    user: {
        id: 123456789,
        username: 'PlayerPro',
        firstName: 'Pro',
        lastName: 'Gamer',
        coins: 75000,
        totalCards: 156,
        commonCards: 98,
        rareCards: 42,
        epicCards: 12,
        legendaryCards: 4,
        dailyBonusClaimed: false,
        lastDailyBonus: null,
        referrals: 5,
        referralCoins: 2500,
        createdAt: '2024-01-15'
    },

    packs: [
        { id: 'free', name: 'Free Pack', price: 0, boost: { common: 70, rare: 20, epic: 8, legendary: 2 }, daily: true },
        { id: 'basic', name: 'Basic Pack', price: 500, boost: { common: 60, rare: 25, epic: 12, legendary: 3 } },
        { id: 'silver', name: 'Silver Pack', price: 1000, boost: { common: 50, rare: 30, epic: 15, legendary: 5 } },
        { id: 'gold', name: 'Gold Pack', price: 2500, boost: { common: 40, rare: 35, epic: 18, legendary: 7 } },
        { id: 'platinum', name: 'Platinum Pack', price: 5000, boost: { common: 30, rare: 38, epic: 22, legendary: 10 } },
        { id: 'diamond', name: 'Diamond Pack', price: 10000, boost: { common: 20, rare: 40, epic: 28, legendary: 12 } },
        { id: 'emerald', name: 'Emerald Pack', price: 25000, boost: { common: 10, rare: 35, epic: 35, legendary: 20 } },
        { id: 'ruby', name: 'Ruby Pack', price: 50000, boost: { common: 5, rare: 30, epic: 40, legendary: 25 } },
        { id: 'sapphire', name: 'Sapphire Pack', price: 100000, boost: { common: 2, rare: 25, epic: 43, legendary: 30 } },
        { id: 'mythic', name: 'Mythic Pack', price: 250000, boost: { common: 0, rare: 15, epic: 45, legendary: 40 } }
    ],

    cards: [],

    cardNames: {
        common: ['Shield Knight', 'Fire Archer', 'Ice Mage', 'Shadow Rogue', 'Nature Druid', 'Storm Warrior', 'Light Paladin', 'Dark Warlock'],
        rare: ['Thunder Dragon', 'Frost Phoenix', 'Blazing Griffin', 'Shadow Panther', 'Crystal Unicorn', 'Storm Eagle', 'Earth Golem', 'Void Specter'],
        epic: ['Celestial Dragon', 'Infernal Phoenix', 'Abyssal Leviathan', 'Celestial Seraph', 'Chaos Titan', 'Eternal Guardian', 'Mythic Phoenix', 'Divine Judge'],
        legendary: ['Omniscient One', 'Infinity Serpent', 'Cosmic Phoenix', 'Eternal Emperor', 'World Creator', 'Dimension Walker', 'Reality Shatterer', 'Supreme Deity']
    },

    cardDescriptions: {
        common: 'A basic card with standard abilities.',
        rare: 'An uncommon card with enhanced powers.',
        epic: 'A powerful card with unique abilities.',
        legendary: 'The rarest and most powerful card!'
    },

    init() {
        if (!localStorage.getItem('nftGameInitialized')) {
            this.generateStarterCards();
            localStorage.setItem('nftGameInitialized', 'true');
        }
        this.loadCards();
    },

    generateStarterCards() {
        for (let i = 0; i < 10; i++) {
            const rarity = this.getWeightedRarity({ common: 70, rare: 20, epic: 8, legendary: 2 });
            this.createCard(rarity);
        }
    },

    getWeightedRarity(boost) {
        const roll = Math.random() * 100;
        let cumulative = 0;
        for (const [rarity, chance] of Object.entries(boost)) {
            cumulative += chance;
            if (roll < cumulative) return rarity;
        }
        return 'common';
    },

    createCard(rarity) {
        const names = this.cardNames[rarity];
        const name = names[Math.floor(Math.random() * names.length)];
        const basePower = rarity === 'common' ? 50 : rarity === 'rare' ? 100 : rarity === 'epic' ? 200 : 400;
        const power = basePower + Math.floor(Math.random() * basePower * 0.5);
        
        const card = {
            id: 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name,
            rarity,
            power,
            speed: Math.floor(Math.random() * 100) + 1,
            defense: Math.floor(Math.random() * 50) + 10,
            specialAbility: this.getSpecialAbility(rarity),
            ownerId: this.user.id,
            isForSale: false,
            salePrice: null,
            imageId: Math.floor(Math.random() * 10),
            createdAt: new Date().toISOString()
        };
        
        this.cards.push(card);
        this.saveCards();
        return card;
    },

    getSpecialAbility(rarity) {
        const abilities = {
            common: ['Quick Strike', 'Block', 'Heal'],
            rare: ['Double Attack', 'Shield Bash', 'Life Steal'],
            epic: ['Fire Storm', 'Ice Barrier', 'Shadow Clone'],
            legendary: ['Ultimate Destruction', 'Time Warp', 'Dimension Rift']
        };
        const options = abilities[rarity];
        return options[Math.floor(Math.random() * options.length)];
    },

    loadCards() {
        const saved = localStorage.getItem('nftCards');
        if (saved) {
            this.cards = JSON.parse(saved);
        }
    },

    saveCards() {
        localStorage.setItem('nftCards', JSON.stringify(this.cards));
    },

    request(endpoint, data = {}) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    let result;
                    
                    switch(endpoint) {
                        case '/getUser':
                            result = { success: true, data: { ...this.user } };
                            break;
                            
                        case '/getUserStats':
                            result = {
                                success: true,
                                data: {
                                    ...this.user,
                                    collection: this.cards.filter(c => c.ownerId === this.user.id)
                                }
                            };
                            break;
                            
                        case '/openPack':
                            const pack = this.packs.find(p => p.id === data.packType);
                            if (!pack) throw new Error('Pack not found');
                            
                            if (data.packType === 'free') {
                                if (this.user.dailyBonusClaimed) {
                                    throw new Error('Daily free pack already claimed');
                                }
                            } else if (this.user.coins < pack.price) {
                                throw new Error('Insufficient coins');
                            }
                            
                            const newCards = [];
                            for (let i = 0; i < 3; i++) {
                                const rarity = this.getWeightedRarity(pack.boost);
                                newCards.push(this.createCard(rarity));
                            }
                            
                            if (data.packType === 'free') {
                                this.user.dailyBonusClaimed = true;
                                this.user.lastDailyBonus = new Date().toISOString();
                            } else {
                                this.user.coins -= pack.price;
                            }
                            
                            this.saveCards();
                            result = {
                                success: true,
                                data: {
                                    cards: newCards,
                                    newBalance: this.user.coins
                                }
                            };
                            break;
                            
                        case '/getCollection':
                            let filtered = this.cards.filter(c => c.ownerId === this.user.id);
                            if (data.rarity) filtered = filtered.filter(c => c.rarity === data.rarity);
                            if (data.sortBy) {
                                filtered.sort((a, b) => {
                                    if (data.sortBy === 'power') return b.power - a.power;
                                    if (data.sortBy === 'recent') return new Date(b.createdAt) - new Date(a.createdAt);
                                    return 0;
                                });
                            }
                            result = { success: true, data: filtered };
                            break;
                            
                        case '/startBattle':
                            if (!data.cardIds || data.cardIds.length !== 3) {
                                throw new Error('Select exactly 3 cards');
                            }
                            const playerCards = data.cardIds.map(id => this.cards.find(c => c.id === id));
                            if (playerCards.some(c => !c)) throw new Error('Invalid card selection');
                            
                            const playerPower = playerCards.reduce((sum, c) => sum + c.power, 0);
                            const opponentPower = Math.floor(Math.random() * playerPower * 1.5);
                            const isWin = playerPower > opponentPower;
                            
                            const opponentCards = [];
                            for (let i = 0; i < 3; i++) {
                                const rarity = this.getWeightedRarity({ common: 50, rare: 30, epic: 15, legendary: 5 });
                                opponentCards.push(this.createCard('opponent_' + Date.now() + i));
                            }
                            
                            if (isWin) {
                                const reward = Math.floor(Math.random() * 500) + 100;
                                this.user.coins += reward;
                                this.saveCards();
                                result = {
                                    success: true,
                                    data: {
                                        playerCards,
                                        opponentCards,
                                        opponentPower,
                                        isWin,
                                        reward
                                    }
                                };
                            } else {
                                result = {
                                    success: true,
                                    data: {
                                        playerCards,
                                        opponentCards,
                                        opponentPower,
                                        isWin,
                                        reward: 0
                                    }
                                };
                            }
                            break;
                            
                        case '/getMarketplace':
                            const marketplaceCards = this.cards.filter(c => c.isForSale && c.ownerId !== this.user.id);
                            const page = data.page || 1;
                            const perPage = 20;
                            const paginated = marketplaceCards.slice((page - 1) * perPage, page * perPage);
                            result = { success: true, data: { cards: paginated, total: marketplaceCards.length, page } };
                            break;
                            
                        case '/listCard':
                            const cardToList = this.cards.find(c => c.id === data.cardId);
                            if (!cardToList) throw new Error('Card not found');
                            if (cardToList.ownerId !== this.user.id) throw new Error('Not your card');
                            
                            cardToList.isForSale = true;
                            cardToList.salePrice = data.price;
                            this.saveCards();
                            result = { success: true, data: cardToList };
                            break;
                            
                        case '/buyCard':
                            const cardToBuy = this.cards.find(c => c.id === data.cardId);
                            if (!cardToBuy) throw new Error('Card not found');
                            if (!cardToBuy.isForSale) throw new Error('Card not for sale');
                            if (cardToBuy.ownerId === this.user.id) throw new Error('Cannot buy own card');
                            if (this.user.coins < cardToBuy.salePrice) throw new Error('Insufficient coins');
                            
                            this.user.coins -= cardToBuy.salePrice;
                            cardToBuy.ownerId = this.user.id;
                            cardToBuy.isForSale = false;
                            cardToBuy.salePrice = null;
                            this.saveCards();
                            result = { success: true, data: { card: cardToBuy, newBalance: this.user.coins } };
                            break;
                            
                        case '/cancelListing':
                            const cardToCancel = this.cards.find(c => c.id === data.cardId);
                            if (!cardToCancel) throw new Error('Card not found');
                            if (cardToCancel.ownerId !== this.user.id) throw new Error('Not your card');
                            
                            cardToCancel.isForSale = false;
                            cardToCancel.salePrice = null;
                            this.saveCards();
                            result = { success: true };
                            break;
                            
                        case '/claimDailyBonus':
                            if (this.user.dailyBonusClaimed) {
                                throw new Error('Daily bonus already claimed');
                            }
                            const bonus = 1000;
                            this.user.coins += bonus;
                            this.user.dailyBonusClaimed = true;
                            this.user.lastDailyBonus = new Date().toISOString();
                            result = { success: true, data: { bonus, newBalance: this.user.coins } };
                            break;
                            
                        case '/getReferralInfo':
                            result = {
                                success: true,
                                data: {
                                    referralLink: `https://t.me/${window.location.hostname}/start?ref=${this.user.id}`,
                                    totalReferrals: this.user.referrals,
                                    earnedCoins: this.user.referralCoins
                                }
                            };
                            break;
                            
                        case '/requestWithdraw':
                            const minWithdraw = 10000;
                            const maxWithdraw = 10000000;
                            
                            if (data.amount < minWithdraw) throw new Error(`Minimum withdrawal is ${minWithdraw.toLocaleString()} coins`);
                            if (data.amount > maxWithdraw) throw new Error(`Maximum withdrawal is ${maxWithdraw.toLocaleString()} coins`);
                            if (this.user.coins < data.amount) throw new Error('Insufficient coins');
                            if (!/^\d{16}$/.test(data.cardNumber)) throw newError('Invalid card number (must be 16 digits)');
                            if (!data.fullName || data.fullName.length < 3) throw new Error('Invalid full name');
                            
                            const withdrawalId = 'WD_' + Date.now();
                            const withdrawal = {
                                id: withdrawalId,
                                userId: this.user.id,
                                username: this.user.username,
                                amount: data.amount,
                                somAmount: data.amount,
                                cardNumber: data.cardNumber,
                                fullName: data.fullName,
                                status: 'pending',
                                createdAt: new Date().toISOString()
                            };
                            
                            this.user.coins -= data.amount;
                            this.saveCards();
                            
                            const pending = JSON.parse(localStorage.getItem('pendingWithdrawals') || '[]');
                            pending.push(withdrawal);
                            localStorage.setItem('pendingWithdrawals', JSON.stringify(pending));
                            
                            result = {
                                success: true,
                                data: {
                                    withdrawalId,
                                    newBalance: this.user.coins
                                }
                            };
                            break;
                            
                        case '/getWithdrawHistory':
                            const allWithdrawals = JSON.parse(localStorage.getItem('pendingWithdrawals') || '[]');
                            const userWithdrawals = allWithdrawals.filter(w => w.userId === this.user.id);
                            result = { success: true, data: userWithdrawals };
                            break;
                            
                        case '/getPackPrices':
                            result = { success: true, data: this.packs };
                            break;
                            
                        default:
                            throw new Error('Unknown endpoint');
                    }
                    
                    resolve(result);
                } catch (error) {
                    reject({ success: false, error: true, message: error.message });
                }
            }, 300 + Math.random() * 500);
        });
    },

    getUser() { return this.request('/getUser'); },
    getUserStats() { return this.request('/getUserStats'); },
    openPack(packType) { return this.request('/openPack', { packType }); },
    getCollection(filters) { return this.request('/getCollection', filters); },
    startBattle(cardIds) { return this.request('/startBattle', { cardIds }); },
    getMarketplace(page) { return this.request('/getMarketplace', { page }); },
    listCard(cardId, price) { return this.request('/listCard', { cardId, price }); },
    buyCard(cardId) { return this.request('/buyCard', { cardId }); },
    cancelListing(cardId) { return this.request('/cancelListing', { cardId }); },
    claimDailyBonus() { return this.request('/claimDailyBonus'); },
    getReferralInfo() { return this.request('/getReferralInfo'); },
    requestWithdraw(amount, cardNumber, fullName) {
        return this.request('/requestWithdraw', { amount, cardNumber, fullName });
    },
    getWithdrawHistory() { return this.request('/getWithdrawHistory'); },
    getPackPrices() { return this.request('/getPackPrices'); }
};

window.MockAPI = MockAPI;
window.API = MockAPI;
