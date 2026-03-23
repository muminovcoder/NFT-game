const Marketplace = {
    cards: [],
    isLoading: false,
    currentPage: 1,
    totalPages: 1,

    async render() {
        App.elements.mainContent.innerHTML = `
            <div class="marketplace-view">
                <header class="view-header">
                    <button class="back-btn ripple" onclick="App.navigateTo('dashboard')">
                        <i class="icon-back"></i>
                    </button>
                    <h1>Marketplace</h1>
                    <div class="coins-display">
                        <span class="coin-icon">🪙</span>
                        <span id="marketplaceCoinBalance">${App.formatNumber(App.state.user?.coins)}</span>
                    </div>
                </header>

                <div class="marketplace-tabs">
                    <button class="tab-btn active" data-tab="buy" onclick="Marketplace.switchTab('buy')">
                        Buy Cards
                    </button>
                    <button class="tab-btn" data-tab="sell" onclick="Marketplace.switchTab('sell')">
                        My Listings
                    </button>
                </div>

                <div class="tab-content" id="buyTab">
                    <div class="marketplace-filters">
                        <select id="marketRarityFilter" class="filter-select" onchange="Marketplace.loadCards()">
                            <option value="">All Rarities</option>
                            <option value="common">Common</option>
                            <option value="rare">Rare</option>
                            <option value="epic">Epic</option>
                            <option value="legendary">Legendary</option>
                        </select>
                        <select id="marketSortFilter" class="filter-select" onchange="Marketplace.loadCards()">
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="power">Power</option>
                        </select>
                    </div>

                    <div class="marketplace-grid" id="marketplaceGrid">
                        <div class="loading-spinner">
                            <div class="spinner"></div>
                            <p>Loading marketplace...</p>
                        </div>
                    </div>

                    <div class="pagination" id="pagination">
                        <button class="page-btn ripple" id="prevPage" onclick="Marketplace.prevPage()" disabled>
                            <i class="icon-arrow-left"></i>
                        </button>
                        <span class="page-info" id="pageInfo">Page 1</span>
                        <button class="page-btn ripple" id="nextPage" onclick="Marketplace.nextPage()" disabled>
                            <i class="icon-arrow-right"></i>
                        </button>
                    </div>
                </div>

                <div class="tab-content hidden" id="sellTab">
                    <div class="my-listings" id="myListings">
                        ${this.renderMyListings()}
                    </div>
                </div>
            </div>
        `;

        await this.loadCards();
    },

    async switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        document.getElementById('buyTab').classList.toggle('hidden', tab !== 'buy');
        document.getElementById('sellTab').classList.toggle('hidden', tab !== 'sell');

        if (tab === 'sell') {
            this.renderMyListingsSection();
        }
    },

    async loadCards() {
        this.isLoading = true;
        const grid = document.getElementById('marketplaceGrid');

        try {
            const response = await API.getMarketplace(this.currentPage);
            
            if (response.success) {
                this.cards = response.data.cards || [];
                this.totalPages = Math.ceil(response.data.total / 20) || 1;
                
                if (this.cards.length === 0) {
                    grid.innerHTML = `
                        <div class="empty-marketplace">
                            <div class="empty-icon">🛒</div>
                            <h3>No Cards Available</h3>
                            <p>Check back later for new listings!</p>
                        </div>
                    `;
                } else {
                    grid.innerHTML = this.cards.map(card => this.renderMarketCard(card)).join('');
                    this.attachCardEvents();
                }

                this.updatePagination();
            }
        } catch (error) {
            grid.innerHTML = `
                <div class="error-message">
                    <p>Failed to load marketplace</p>
                    <button class="btn btn-secondary ripple" onclick="Marketplace.loadCards()">
                        Retry
                    </button>
                </div>
            `;
        } finally {
            this.isLoading = false;
        }
    },

    renderMarketCard(card) {
        const canAfford = App.state.user?.coins >= card.salePrice;
        const rarityClass = `rarity-${card.rarity}`;
        const glowClass = (card.rarity === 'legendary' || card.rarity === 'epic') ? 'card-glow' : '';
        
        return `
            <div class="market-card ${rarityClass} ${glowClass}" data-card-id="${card.id}">
                <div class="market-card-header">
                    <span class="seller-info">@${card.sellerName || 'Anonymous'}</span>
                    <span class="price-tag">${card.salePrice?.toLocaleString()} 🪙</span>
                </div>
                <div class="market-card-body">
                    <div class="card-avatar ${rarityClass}">
                        ${App.getCardEmoji(card.rarity)}
                    </div>
                    <h4 class="market-card-name">${card.name}</h4>
                    <div class="market-card-stats">
                        <span class="power-badge">⚡ ${card.power}</span>
                        <span class="rarity-badge ${rarityClass}">${card.rarity}</span>
                    </div>
                </div>
                <button class="btn ${canAfford ? 'btn-primary' : 'btn-disabled'} ripple"
                        onclick="${canAfford ? `Marketplace.buyCard('${card.id}')` : ''}"
                        ${!canAfford ? 'disabled' : ''}>
                    ${canAfford ? 'Buy Now' : 'Not Enough Coins'}
                </button>
            </div>
        `;
    },

    attachCardEvents() {
        document.querySelectorAll('.market-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.btn')) {
                    App.showCardDetail(card.dataset.cardId);
                }
            });
        });
    },

    async buyCard(cardId) {
        try {
            App.setLoading(true);
            const response = await API.buyCard(cardId);
            
            if (response.success) {
                App.showToast('Card purchased successfully!', 'success');
                await App.refreshUser();
                this.updateCoinDisplay();
                await this.loadCards();
            }
        } catch (error) {
            App.showToast(error.message || 'Purchase failed', 'error');
        } finally {
            App.setLoading(false);
        }
    },

    renderMyListings() {
        const myCards = MockAPI.cards.filter(c => c.ownerId === MockAPI.user.id && c.isForSale);
        
        if (myCards.length === 0) {
            return `
                <div class="empty-listings">
                    <div class="empty-icon">📋</div>
                    <h3>No Active Listings</h3>
                    <p>Go to your collection to list cards for sale!</p>
                    <button class="btn btn-primary ripple" onclick="App.navigateTo('collection')">
                        View Collection
                    </button>
                </div>
            `;
        }

        return myCards.map(card => `
            <div class="listing-card rarity-${card.rarity}">
                <div class="listing-info">
                    <div class="card-avatar-small rarity-${card.rarity}">
                        ${App.getCardEmoji(card.rarity)}
                    </div>
                    <div class="listing-details">
                        <h4>${card.name}</h4>
                        <span class="power">⚡ ${card.power}</span>
                    </div>
                </div>
                <div class="listing-price">${card.salePrice?.toLocaleString()} 🪙</div>
                <button class="btn btn-danger ripple" onclick="Marketplace.cancelListing('${card.id}')">
                    Cancel
                </button>
            </div>
        `).join('');
    },

    renderMyListingsSection() {
        const container = document.getElementById('myListings');
        if (container) {
            container.innerHTML = this.renderMyListings();
        }
    },

    async cancelListing(cardId) {
        try {
            App.setLoading(true);
            await API.cancelListing(cardId);
            App.showToast('Listing cancelled', 'success');
            await App.refreshUser();
            this.renderMyListingsSection();
        } catch (error) {
            App.showToast(error.message || 'Failed to cancel', 'error');
        } finally {
            App.setLoading(false);
        }
    },

    updateCoinDisplay() {
        const balanceEl = document.getElementById('marketplaceCoinBalance');
        if (balanceEl && App.state.user) {
            balanceEl.textContent = App.formatNumber(App.state.user.coins);
        }
    },

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadCards();
        }
    },

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadCards();
        }
    },

    updatePagination() {
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const pageInfo = document.getElementById('pageInfo');

        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= this.totalPages;
        if (pageInfo) pageInfo.textContent = `Page ${this.currentPage}`;
    }
};

window.Marketplace = Marketplace;
