const Packs = {
    isOpening: false,
    selectedPack: null,

    async render() {
        App.elements.mainContent.innerHTML = `
            <div class="packs-view">
                <header class="view-header">
                    <button class="back-btn ripple" onclick="App.navigateTo('dashboard')">
                        <i class="icon-back"></i>
                    </button>
                    <h1>Card Packs</h1>
                    <div class="coins-display">
                        <span class="coin-icon">🪙</span>
                        <span id="packsCoinBalance">${App.formatNumber(App.state.user?.coins)}</span>
                    </div>
                </header>

                <section class="free-pack-section">
                    <div class="free-pack-card ripple" id="freePackCard" onclick="Packs.openFreePack()">
                        <div class="free-pack-badge">FREE</div>
                        <div class="free-pack-content">
                            <div class="pack-icon free-icon">
                                <i class="icon-gift"></i>
                            </div>
                            <div class="free-pack-info">
                                <h3>Free Daily Pack</h3>
                                <p>3 cards • 70% Common, 20% Rare</p>
                                <span class="free-status" id="freePackStatus">
                                    ${App.state.user?.dailyBonusClaimed ? '✅ Claimed Today' : '🎁 Available Now!'}
                                </span>
                            </div>
                        </div>
                        <div class="free-pack-timer" id="freePackTimer">
                            ${App.state.user?.dailyBonusClaimed ? 'Next in: ' + this.getTimeUntilNextFree() : ''}
                        </div>
                    </div>
                </section>

                <section class="paid-packs-section">
                    <h2 class="section-title">Premium Packs</h2>
                    <div class="packs-grid" id="packsGrid">
                        ${this.renderPacksGrid()}
                    </div>
                </section>

                <div class="pack-modal hidden" id="packOpeningModal">
                    <div class="pack-modal-content">
                        <div class="pack-opening-animation">
                            <div class="pack-container" id="packContainer">
                                <div class="pack-front" id="packFront">
                                    <div class="pack-emblem">🎴</div>
                                    <span class="pack-name" id="packName">Pack Name</span>
                                </div>
                            </div>
                        </div>
                        <div class="cards-reveal hidden" id="cardsReveal">
                            <h3 class="reveal-title">You got:</h3>
                            <div class="revealed-cards" id="revealedCards"></div>
                        </div>
                        <button class="btn btn-primary ripple hidden" id="claimCardsBtn" onclick="Packs.claimCards()">
                            Claim Cards
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.startTimerUpdate();
    },

    renderPacksGrid() {
        const packs = MockAPI.packs.filter(p => p.id !== 'free');
        const userCoins = App.state.user?.coins || 0;

        return packs.map(pack => {
            const canAfford = userCoins >= pack.price;
            const boostClass = this.getBoostClass(pack);
            
            return `
                <div class="pack-card ${boostClass} ${!canAfford ? 'pack-disabled' : ''}" 
                     data-pack-id="${pack.id}"
                     onclick="${canAfford ? `Packs.selectPack('${pack.id}')` : ''}">
                    <div class="pack-header">
                        <span class="pack-tier">${this.getPackTier(pack.id)}</span>
                        <span class="pack-price">${pack.price.toLocaleString()} 🪙</span>
                    </div>
                    <div class="pack-visual">
                        <div class="pack-icon-large ${boostClass}">
                            ${this.getPackEmoji(pack.id)}
                        </div>
                    </div>
                    <h3 class="pack-title">${pack.name}</h3>
                    <div class="pack-odds">
                        <div class="odds-row">
                            <span class="odds-label">Common</span>
                            <div class="odds-bar">
                                <div class="odds-fill common-fill" style="width: ${pack.boost.common}%"></div>
                            </div>
                            <span class="odds-value">${pack.boost.common}%</span>
                        </div>
                        <div class="odds-row">
                            <span class="odds-label">Rare</span>
                            <div class="odds-bar">
                                <div class="odds-fill rare-fill" style="width: ${pack.boost.rare}%"></div>
                            </div>
                            <span class="odds-value">${pack.boost.rare}%</span>
                        </div>
                        <div class="odds-row">
                            <span class="odds-label">Epic</span>
                            <div class="odds-bar">
                                <div class="odds-fill epic-fill" style="width: ${pack.boost.epic}%"></div>
                            </div>
                            <span class="odds-value">${pack.boost.epic}%</span>
                        </div>
                        <div class="odds-row">
                            <span class="odds-label">Legendary</span>
                            <div class="odds-bar">
                                <div class="odds-fill legendary-fill" style="width: ${pack.boost.legendary}%"></div>
                            </div>
                            <span class="odds-value">${pack.boost.legendary}%</span>
                        </div>
                    </div>
                    ${!canAfford ? '<div class="pack-locked"><i class="icon-lock"></i> Not enough coins</div>' : ''}
                </div>
            `;
        }).join('');
    },

    getPackTier(packId) {
        const tiers = {
            basic: '★☆☆☆☆',
            silver: '★★☆☆☆',
            gold: '★★★☆☆',
            platinum: '★★★★☆',
            diamond: '★★★★★',
            emerald: '💎',
            ruby: '💎💎',
            sapphire: '💎💎💎',
            mythic: '🔥🔥🔥'
        };
        return tiers[packId] || '★';
    },

    getPackEmoji(packId) {
        const emojis = {
            basic: '📦',
            silver: '🎁',
            gold: '💰',
            platinum: '💎',
            diamond: '💠',
            emerald: '🟢',
            ruby: '🔴',
            sapphire: '🔵',
            mythic: '🌟'
        };
        return emojis[packId] || '🎴';
    },

    getBoostClass(packId) {
        const classes = {
            basic: 'boost-basic',
            silver: 'boost-silver',
            gold: 'boost-gold',
            platinum: 'boost-platinum',
            diamond: 'boost-diamond',
            emerald: 'boost-emerald',
            ruby: 'boost-ruby',
            sapphire: 'boost-sapphire',
            mythic: 'boost-mythic'
        };
        return classes[packId] || 'boost-basic';
    },

    async openFreePack() {
        if (App.state.user?.dailyBonusClaimed) {
            App.showToast('Free pack already claimed today!', 'info');
            return;
        }

        await this.openPack('free');
    },

    selectPack(packId) {
        const pack = MockAPI.packs.find(p => p.id === packId);
        if (!pack) return;

        this.selectedPack = pack;
        this.showPackConfirmation(pack);
    },

    showPackConfirmation(pack) {
        const content = `
            <div class="confirm-pack">
                <div class="confirm-pack-icon ${this.getBoostClass(pack.id)}">
                    ${this.getPackEmoji(pack.id)}
                </div>
                <h2>${pack.name}</h2>
                <p class="confirm-price">${pack.price.toLocaleString()} coins</p>
                
                <div class="confirm-details">
                    <p>You will receive <strong>3 random cards</strong></p>
                    <div class="confirm-odds">
                        <span class="rarity-common">Common: ${pack.boost.common}%</span>
                        <span class="rarity-rare">Rare: ${pack.boost.rare}%</span>
                        <span class="rarity-epic">Epic: ${pack.boost.epic}%</span>
                        <span class="rarity-legendary">Legendary: ${pack.boost.legendary}%</span>
                    </div>
                </div>

                <div class="confirm-actions">
                    <button class="btn btn-secondary ripple" onclick="App.closeModal()">Cancel</button>
                    <button class="btn btn-primary ripple" onclick="Packs.confirmPurchase('${pack.id}')">
                        Open Pack
                    </button>
                </div>
            </div>
        `;

        App.showModal(content);
    },

    async confirmPurchase(packId) {
        App.closeModal();
        await this.openPack(packId);
    },

    async openPack(packId) {
        if (this.isOpening) return;
        this.isOpening = true;

        const modal = document.getElementById('packOpeningModal');
        const pack = MockAPI.packs.find(p => p.id === packId);
        const packFront = document.getElementById('packFront');
        const packName = document.getElementById('packName');

        modal.classList.remove('hidden');
        packFront.className = `pack-front ${this.getBoostClass(packId)}`;
        packName.textContent = pack?.name || 'Pack';

        App.hapticFeedback('heavy');

        await this.delay(800);
        packFront.classList.add('flipping');

        await this.delay(1000);
        packFront.classList.add('flipped');

        await this.delay(500);

        try {
            const response = await API.openPack(packId);
            
            if (response.success) {
                await this.showCardsReveal(response.data.cards);
                await App.refreshUser();
                this.updateCoinDisplay();
            }
        } catch (error) {
            App.showToast(error.message || 'Failed to open pack', 'error');
            modal.classList.add('hidden');
        } finally {
            this.isOpening = false;
        }
    },

    async showCardsReveal(cards) {
        const cardsReveal = document.getElementById('cardsReveal');
        const revealedCards = document.getElementById('revealedCards');
        const claimBtn = document.getElementById('claimCardsBtn');

        revealedCards.innerHTML = '';
        cardsReveal.classList.remove('hidden');

        for (let i = 0; i < cards.length; i++) {
            await this.delay(400);
            const card = cards[i];
            
            const cardEl = document.createElement('div');
            cardEl.className = `revealed-card rarity-${card.rarity} ${card.rarity === 'legendary' || card.rarity === 'epic' ? 'card-glow' : ''}`;
            cardEl.innerHTML = `
                <div class="card-avatar rarity-${card.rarity}">
                    ${App.getCardEmoji(card.rarity)}
                </div>
                <span class="card-rarity-badge">${card.rarity.toUpperCase()}</span>
                <h4 class="card-name">${card.name}</h4>
                <div class="card-power">⚡ ${card.power}</div>
            `;
            
            revealedCards.appendChild(cardEl);
            App.hapticFeedback('success');
            
            if (card.rarity === 'legendary') {
                cardEl.classList.add('legendary-reveal');
            }
        }

        await this.delay(500);
        claimBtn.classList.remove('hidden');
    },

    claimCards() {
        const modal = document.getElementById('packOpeningModal');
        const cardsReveal = document.getElementById('cardsReveal');
        const claimBtn = document.getElementById('claimCardsBtn');
        const packFront = document.getElementById('packFront');

        cardsReveal.classList.add('hidden');
        claimBtn.classList.add('hidden');
        packFront.classList.remove('flipped', 'flipping');

        setTimeout(() => {
            modal.classList.add('hidden');
            if (App.state.currentView === 'packs') {
                this.render();
            }
        }, 300);

        App.showToast('Cards added to your collection!', 'success');
        App.hapticFeedback('light');
    },

    updateCoinDisplay() {
        const balanceEl = document.getElementById('packsCoinBalance');
        if (balanceEl && App.state.user) {
            balanceEl.textContent = App.formatNumber(App.state.user.coins);
        }
    },

    getTimeUntilNextFree() {
        if (!App.state.user?.lastDailyBonus) return '24:00:00';
        
        const lastClaim = new Date(App.state.user.lastDailyBonus);
        const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
        const now = new Date();
        
        const diff = nextClaim - now;
        if (diff <= 0) return '00:00:00';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    startTimerUpdate() {
        const timerEl = document.getElementById('freePackTimer');
        const statusEl = document.getElementById('freePackStatus');
        
        if (!timerEl) return;
        
        setInterval(() => {
            if (App.state.user?.dailyBonusClaimed) {
                timerEl.textContent = 'Next in: ' + this.getTimeUntilNextFree();
                
                if (this.getTimeUntilNextFree() === '00:00:00') {
                    App.state.user.dailyBonusClaimed = false;
                    statusEl.innerHTML = '🎁 Available Now!';
                    statusEl.parentElement.parentElement.classList.add('available');
                }
            }
        }, 1000);
    },

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

window.Packs = Packs;
