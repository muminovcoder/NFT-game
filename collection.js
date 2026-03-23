const Collection = {
    cards: [],
    isLoading: false,
    currentFilter: 'all',
    currentSort: 'recent',
    selectedCards: new Set(),

    async render() {
        App.elements.mainContent.innerHTML = `
            <div class="collection-view">
                <header class="view-header">
                    <button class="back-btn ripple" onclick="App.navigateTo('dashboard')">
                        <i class="icon-back"></i>
                    </button>
                    <h1>Collection</h1>
                    <div class="collection-count" id="collectionCount">0 Cards</div>
                </header>

                <div class="collection-filters">
                    <div class="filter-group">
                        <label>Rarity:</label>
                        <select id="rarityFilter" class="filter-select" onchange="Collection.filterChanged()">
                            <option value="all">All</option>
                            <option value="common">Common</option>
                            <option value="rare">Rare</option>
                            <option value="epic">Epic</option>
                            <option value="legendary">Legendary</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Sort:</label>
                        <select id="sortFilter" class="filter-select" onchange="Collection.sortChanged()">
                            <option value="recent">Recent</option>
                            <option value="power">Power</option>
                            <option value="rarity">Rarity</option>
                        </select>
                    </div>
                </div>

                <div class="collection-stats">
                    <div class="stat-badge common">
                        <span class="stat-icon">🛡️</span>
                        <span class="stat-count" id="statCommon">0</span>
                    </div>
                    <div class="stat-badge rare">
                        <span class="stat-icon">🐉</span>
                        <span class="stat-count" id="statRare">0</span>
                    </div>
                    <div class="stat-badge epic">
                        <span class="stat-icon">🔥</span>
                        <span class="stat-count" id="statEpic">0</span>
                    </div>
                    <div class="stat-badge legendary">
                        <span class="stat-icon">👑</span>
                        <span class="stat-count" id="statLegendary">0</span>
                    </div>
                </div>

                <div class="collection-grid" id="collectionGrid">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <p>Loading cards...</p>
                    </div>
                </div>

                <div class="collection-empty hidden" id="collectionEmpty">
                    <div class="empty-icon">🃏</div>
                    <h3>No Cards Found</h3>
                    <p>Open some packs to start collecting!</p>
                    <button class="btn btn-primary ripple" onclick="App.navigateTo('packs')">
                        Open Packs
                    </button>
                </div>
            </div>
        `;

        await this.loadCards();
    },

    async loadCards() {
        this.isLoading = true;
        
        try {
            const response = await API.getCollection({
                rarity: this.currentFilter !== 'all' ? this.currentFilter : null,
                sortBy: this.currentSort
            });

            if (response.success) {
                this.cards = response.data;
                this.renderCards();
                this.updateStats();
            }
        } catch (error) {
            App.showToast('Failed to load collection', 'error');
        } finally {
            this.isLoading = false;
        }
    },

    renderCards() {
        const grid = document.getElementById('collectionGrid');
        const empty = document.getElementById('collectionEmpty');
        const count = document.getElementById('collectionCount');

        if (this.cards.length === 0) {
            grid.innerHTML = '';
            grid.classList.add('hidden');
            empty.classList.remove('hidden');
            count.textContent = '0 Cards';
            return;
        }

        grid.classList.remove('hidden');
        empty.classList.add('hidden');
        count.textContent = `${this.cards.length} Cards`;

        grid.innerHTML = this.cards.map(card => this.renderCardItem(card)).join('');

        grid.querySelectorAll('.card').forEach(cardEl => {
            cardEl.addEventListener('click', () => {
                const cardId = cardEl.dataset.cardId;
                App.showCardDetail(cardId);
            });
        });
    },

    renderCardItem(card) {
        const isSelected = this.selectedCards.has(card.id);
        const rarityClass = `rarity-${card.rarity}`;
        const glowClass = (card.rarity === 'legendary' || card.rarity === 'epic') ? 'card-glow' : '';
        
        return `
            <div class="card-item ${rarityClass} ${glowClass} ${isSelected ? 'card-selected' : ''}" 
                 data-card-id="${card.id}"
                 onclick="Collection.toggleCardSelection('${card.id}')">
                <div class="card-item-inner">
                    <div class="card-avatar-small ${rarityClass}">
                        ${App.getCardEmoji(card.rarity)}
                    </div>
                    <div class="card-item-info">
                        <h4 class="card-item-name">${card.name}</h4>
                        <div class="card-item-stats">
                            <span class="power-stat">⚡${card.power}</span>
                            <span class="rarity-badge ${rarityClass}">${card.rarity}</span>
                        </div>
                    </div>
                    ${isSelected ? '<div class="selected-check">✓</div>' : ''}
                </div>
            </div>
        `;
    },

    toggleCardSelection(cardId) {
        if (this.selectedCards.has(cardId)) {
            this.selectedCards.delete(cardId);
        } else if (this.selectedCards.size < 3) {
            this.selectedCards.add(cardId);
        } else {
            App.showToast('Maximum 3 cards for battle!', 'info');
            return;
        }

        const cardEl = document.querySelector(`[data-card-id="${cardId}"]`);
        if (cardEl) {
            cardEl.classList.toggle('card-selected', this.selectedCards.has(cardId));
        }

        App.hapticFeedback('light');
    },

    clearSelection() {
        this.selectedCards.clear();
        document.querySelectorAll('.card-item').forEach(el => {
            el.classList.remove('card-selected');
        });
    },

    filterChanged() {
        this.currentFilter = document.getElementById('rarityFilter')?.value || 'all';
        this.loadCards();
    },

    sortChanged() {
        this.currentSort = document.getElementById('sortFilter')?.value || 'recent';
        this.loadCards();
    },

    updateStats() {
        const stats = {
            common: 0,
            rare: 0,
            epic: 0,
            legendary: 0
        };

        this.cards.forEach(card => {
            if (stats[card.rarity] !== undefined) {
                stats[card.rarity]++;
            }
        });

        document.getElementById('statCommon').textContent = stats.common;
        document.getElementById('statRare').textContent = stats.rare;
        document.getElementById('statEpic').textContent = stats.epic;
        document.getElementById('statLegendary').textContent = stats.legendary;
    },

    getSelectedCardIds() {
        return Array.from(this.selectedCards);
    }
};

window.Collection = Collection;
