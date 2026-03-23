const App = {
    state: {
        user: null,
        currentView: 'dashboard',
        isLoading: false,
        selectedCards: [],
        marketplacePage: 1,
        collectionFilter: 'all',
        collectionSort: 'recent'
    },

    elements: {},

    async init() {
        this.cacheElements();
        this.bindEvents();
        this.initTelegram();
        await this.loadUser();
        this.render();
        this.startCoinAnimation();
    },

    cacheElements() {
        this.elements = {
            app: document.getElementById('app'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            coinBalance: document.getElementById('coinBalance'),
            username: document.getElementById('username'),
            userId: document.getElementById('userId'),
            avatar: document.getElementById('userAvatar'),
            cardStats: document.getElementById('cardStats'),
            mainContent: document.getElementById('mainContent'),
            toast: document.getElementById('toast'),
            toastMessage: document.getElementById('toastMessage'),
            modal: document.getElementById('modal'),
            modalContent: document.getElementById('modalContent'),
            modalClose: document.getElementById('modalClose')
        };
    },

    bindEvents() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.navigateTo(view);
            });
        });

        this.elements.modalClose?.addEventListener('click', () => this.closeModal());
        this.elements.modal?.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) this.closeModal();
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('ripple')) {
                this.createRipple(e);
            }
        });
    },

    initTelegram() {
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();
            tg.enableClosingConfirmation();
            
            tg.HapticFeedback = {
                impactOccurred: (style = 'medium') => {
                    if (tg.hapticFeedback) tg.hapticFeedback.impactOccurred(style);
                },
                notificationOccurred: (type) => {
                    if (tg.hapticFeedback) tg.hapticFeedback.notificationOccurred(type);
                }
            };
        }
    },

    async loadUser() {
        try {
            this.setLoading(true);
            const response = await API.getUser();
            if (response.success) {
                this.state.user = response.data;
            }
        } catch (error) {
            this.showToast('Failed to load user data', 'error');
        } finally {
            this.setLoading(false);
        }
    },

    async refreshUser() {
        try {
            const response = await API.getUser();
            if (response.success) {
                this.state.user = response.data;
                this.updateHeader();
            }
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    },

    updateHeader() {
        const user = this.state.user;
        if (!user) return;

        this.animateCoinChange(this.elements.coinBalance, user.coins);
        this.elements.username.textContent = `@${user.username}`;
        this.elements.userId.textContent = `ID: ${user.id}`;
        
        const initials = user.firstName?.[0] || user.username?.[0] || 'U';
        this.elements.avatar.innerHTML = `<span>${initials}</span>`;
        
        this.elements.cardStats.innerHTML = `
            <div class="stat-item">
                <span class="stat-value rarity-common">${user.commonCards || 0}</span>
                <span class="stat-label">Common</span>
            </div>
            <div class="stat-item">
                <span class="stat-value rarity-rare">${user.rareCards || 0}</span>
                <span class="stat-label">Rare</span>
            </div>
            <div class="stat-item">
                <span class="stat-value rarity-epic">${user.epicCards || 0}</span>
                <span class="stat-label">Epic</span>
            </div>
            <div class="stat-item">
                <span class="stat-value rarity-legendary">${user.legendaryCards || 0}</span>
                <span class="stat-label">Legendary</span>
            </div>
        `;
    },

    animateCoinChange(element, newValue) {
        const current = parseInt(element.textContent.replace(/,/g, '')) || 0;
        const diff = newValue - current;
        const steps = 30;
        const increment = diff / steps;
        let step = 0;

        const animate = () => {
            step++;
            const value = Math.round(current + increment * step);
            element.textContent = value.toLocaleString();
            
            if (step < steps) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = newValue.toLocaleString();
            }
        };

        requestAnimationFrame(animate);
    },

    startCoinAnimation() {
        setInterval(() => {
            if (this.state.user && Math.random() > 0.7) {
                const coinEl = document.querySelector('.coin-icon');
                if (coinEl) {
                    coinEl.classList.add('coin-bounce');
                    setTimeout(() => coinEl.classList.remove('coin-bounce'), 500);
                }
            }
        }, 3000);
    },

    navigateTo(view) {
        this.state.currentView = view;
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        this.renderView(view);
        this.hapticFeedback('light');
    },

    renderView(view) {
        const views = {
            dashboard: this.renderDashboard,
            packs: this.renderPacks,
            collection: this.renderCollection,
            battle: this.renderBattle,
            marketplace: this.renderMarketplace,
            bonus: this.renderBonus,
            referral: this.renderReferral,
            withdraw: this.renderWithdraw
        };

        if (views[view]) {
            views[view].call(this);
        }
    },

    render() {
        this.updateHeader();
        this.renderView('dashboard');
    },

    renderDashboard() {
        this.elements.mainContent.innerHTML = `
            <div class="dashboard">
                <section class="hero-section">
                    <div class="hero-content">
                        <h1 class="game-title">
                            <span class="title-glow">NFT Cards</span>
                            <span class="title-sub">Collection Game</span>
                        </h1>
                        <div class="quick-stats">
                            <div class="quick-stat">
                                <i class="icon-cards"></i>
                                <span>${this.state.user?.totalCards || 0} Cards</span>
                            </div>
                            <div class="quick-stat">
                                <i class="icon-battle"></i>
                                <span>Win Battles</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="quick-actions">
                    <button class="action-card ripple" data-view="packs">
                        <div class="action-icon"><i class="icon-pack"></i></div>
                        <span>Open Pack</span>
                    </button>
                    <button class="action-card ripple" data-view="battle">
                        <div class="action-icon"><i class="icon-sword"></i></div>
                        <span>Battle</span>
                    </button>
                    <button class="action-card ripple" data-view="collection">
                        <div class="action-icon"><i class="icon-collection"></i></div>
                        <span>Collection</span>
                    </button>
                    <button class="action-card ripple" data-view="marketplace">
                        <div class="action-icon"><i class="icon-market"></i></div>
                        <span>Market</span>
                    </button>
                </section>

                <section class="features-grid">
                    <button class="feature-card ripple" data-view="bonus">
                        <div class="feature-icon daily-icon">
                            <i class="icon-gift"></i>
                        </div>
                        <div class="feature-info">
                            <h3>Daily Bonus</h3>
                            <p>Claim free coins</p>
                        </div>
                        <i class="icon-arrow"></i>
                    </button>
                    <button class="feature-card ripple" data-view="referral">
                        <div class="feature-icon ref-icon">
                            <i class="icon-users"></i>
                        </div>
                        <div class="feature-info">
                            <h3>Referral</h3>
                            <p>Invite & earn</p>
                        </div>
                        <i class="icon-arrow"></i>
                    </button>
                    <button class="feature-card ripple" data-view="withdraw">
                        <div class="feature-icon withdraw-icon">
                            <i class="icon-wallet"></i>
                        </div>
                        <div class="feature-info">
                            <h3>Withdraw</h3>
                            <p>Convert to UZS</p>
                        </div>
                        <i class="icon-arrow"></i>
                    </button>
                </section>

                <section class="recent-cards">
                    <h2 class="section-title">Your Recent Cards</h2>
                    <div class="recent-cards-grid" id="recentCardsGrid">
                        ${this.renderRecentCards()}
                    </div>
                </section>
            </div>
        `;

        this.elements.mainContent.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', () => this.navigateTo(btn.dataset.view));
        });
    },

    renderRecentCards() {
        const userCards = this.getUserCards().slice(-6).reverse();
        if (userCards.length === 0) {
            return '<p class="empty-message">No cards yet. Open a pack to get started!</p>';
        }
        
        return userCards.map(card => this.renderCardHTML(card, true)).join('');
    },

    getUserCards() {
        return MockAPI.cards.filter(c => c.ownerId === MockAPI.user.id);
    },

    renderCardHTML(card, small = false) {
        const rarityClass = `rarity-${card.rarity}`;
        const glowClass = card.rarity === 'legendary' || card.rarity === 'epic' ? 'card-glow' : '';
        
        return `
            <div class="card ${rarityClass} ${glowClass} ${small ? 'card-small' : ''}" 
                 data-card-id="${card.id}" 
                 onclick="App.showCardDetail('${card.id}')">
                <div class="card-inner">
                    <div class="card-front">
                        <div class="card-image">
                            <div class="card-avatar ${rarityClass}">
                                ${this.getCardEmoji(card.rarity)}
                            </div>
                        </div>
                        <div class="card-info">
                            <h4 class="card-name">${card.name}</h4>
                            <div class="card-stats-row">
                                <span class="power-badge">⚡${card.power}</span>
                            </div>
                        </div>
                    </div>
                </div>
                ${card.isForSale ? `<div class="sale-badge">${card.salePrice?.toLocaleString()}</div>` : ''}
            </div>
        `;
    },

    getCardEmoji(rarity) {
        const emojis = {
            common: '🛡️',
            rare: '🐉',
            epic: '🔥',
            legendary: '👑'
        };
        return emojis[rarity] || '🃏';
    },

    showCardDetail(cardId) {
        const card = MockAPI.cards.find(c => c.id === cardId);
        if (!card) return;

        const isOwner = card.ownerId === MockAPI.user.id;
        const rarityClass = `rarity-${card.rarity}`;
        
        const content = `
            <div class="card-detail ${rarityClass} ${card.rarity === 'legendary' || card.rarity === 'epic' ? 'card-glow' : ''}">
                <div class="detail-card-wrapper">
                    <div class="detail-card">
                        <div class="detail-card-avatar ${rarityClass}">
                            ${this.getCardEmoji(card.rarity)}
                        </div>
                        <div class="detail-card-badge ${rarityClass}">${card.rarity.toUpperCase()}</div>
                    </div>
                </div>
                <h2 class="detail-card-name">${card.name}</h2>
                <p class="detail-card-desc">${this.getCardDescription(card.rarity)}</p>
                
                <div class="detail-stats">
                    <div class="detail-stat">
                        <span class="detail-stat-label">Power</span>
                        <span class="detail-stat-value">⚡ ${card.power}</span>
                    </div>
                    <div class="detail-stat">
                        <span class="detail-stat-label">Speed</span>
                        <span class="detail-stat-value">💨 ${card.speed}</span>
                    </div>
                    <div class="detail-stat">
                        <span class="detail-stat-label">Defense</span>
                        <span class="detail-stat-value">🛡️ ${card.defense}</span>
                    </div>
                    <div class="detail-stat">
                        <span class="detail-stat-label">Ability</span>
                        <span class="detail-stat-value">✨ ${card.specialAbility}</span>
                    </div>
                </div>

                ${isOwner ? `
                    <div class="detail-actions">
                        ${!card.isForSale ? `
                            <button class="btn btn-primary ripple" onclick="App.listCardForSale('${card.id}')">
                                <i class="icon-tag"></i> List for Sale
                            </button>
                        ` : `
                            <button class="btn btn-danger ripple" onclick="App.cancelCardSale('${card.id}')">
                                <i class="icon-close"></i> Cancel Sale
                            </button>
                            <div class="sale-info">Listed for ${card.salePrice?.toLocaleString()} coins</div>
                        `}
                    </div>
                ` : ''}
            </div>
        `;

        this.showModal(content);
    },

    getCardDescription(rarity) {
        const descriptions = {
            common: 'A standard card with basic capabilities. Every collector starts here!',
            rare: 'An enhanced card with superior stats. Great addition to any deck!',
            epic: 'A powerful card featuring unique abilities. Highly sought after!',
            legendary: 'THE RAREST card in existence! Features ultimate power and abilities!'
        };
        return descriptions[rarity] || '';
    },

    async listCardForSale(cardId) {
        const price = prompt('Enter sale price (coins):');
        if (!price || isNaN(price) || parseInt(price) <= 0) {
            this.showToast('Invalid price', 'error');
            return;
        }

        try {
            this.setLoading(true);
            await API.listCard(cardId, parseInt(price));
            this.showToast('Card listed for sale!', 'success');
            this.closeModal();
            await this.refreshUser();
        } catch (error) {
            this.showToast(error.message || 'Failed to list card', 'error');
        } finally {
            this.setLoading(false);
        }
    },

    async cancelCardSale(cardId) {
        try {
            this.setLoading(true);
            await API.cancelListing(cardId);
            this.showToast('Sale cancelled', 'success');
            this.closeModal();
            await this.refreshUser();
        } catch (error) {
            this.showToast(error.message || 'Failed to cancel sale', 'error');
        } finally {
            this.setLoading(false);
        }
    },

    setLoading(isLoading) {
        this.state.isLoading = isLoading;
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.toggle('hidden', !isLoading);
        }
        document.body.style.overflow = isLoading ? 'hidden' : '';
    },

    showToast(message, type = 'info') {
        const toast = this.elements.toast;
        const toastMessage = this.elements.toastMessage;
        
        toastMessage.textContent = message;
        toast.className = `toast toast-${type}`;
        toast.classList.remove('hidden');
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hidden');
        }, 3000);
    },

    showModal(content) {
        if (this.elements.modalContent) {
            this.elements.modalContent.innerHTML = content;
        }
        if (this.elements.modal) {
            this.elements.modal.classList.remove('hidden');
            this.elements.modal.classList.add('show');
        }
    },

    closeModal() {
        if (this.elements.modal) {
            this.elements.modal.classList.remove('show');
            this.elements.modal.classList.add('hidden');
        }
    },

    hapticFeedback(style = 'medium') {
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
        }
    },

    createRipple(event) {
        const button = event.target.closest('.ripple');
        if (!button) return;

        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        button.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    },

    formatNumber(num) {
        return (num || 0).toLocaleString();
    }
};

window.App = App;
