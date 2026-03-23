const Battle = {
    isBattling: false,
    playerCards: [],
    selectedCards: [],
    battleResult: null,

    async render() {
        App.elements.mainContent.innerHTML = `
            <div class="battle-view">
                <header class="view-header">
                    <button class="back-btn ripple" onclick="App.navigateTo('dashboard')">
                        <i class="icon-back"></i>
                    </button>
                    <h1>Battle Arena</h1>
                </header>

                <section class="battle-instructions">
                    <div class="instruction-box">
                        <h3>⚔️ How to Battle</h3>
                        <ul>
                            <li>Select 3 cards from your collection</li>
                            <li>Your total power vs opponent's power</li>
                            <li>Win to earn coins!</li>
                        </ul>
                    </div>
                </section>

                <section class="battle-selection">
                    <div class="selection-header">
                        <h3>Select Your Cards</h3>
                        <span class="selection-count" id="selectionCount">0/3 selected</span>
                    </div>
                    
                    <div class="battle-card-grid" id="battleCardGrid">
                        ${await this.renderBattleCards()}
                    </div>

                    <div class="selected-cards-preview" id="selectedPreview">
                        <h4>Selected Cards:</h4>
                        <div class="preview-slots" id="previewSlots">
                            <div class="preview-slot empty">?</div>
                            <div class="preview-slot empty">?</div>
                            <div class="preview-slot empty">?</div>
                        </div>
                    </div>

                    <button class="btn btn-battle ripple" id="startBattleBtn" 
                            onclick="Battle.startBattle()" 
                            disabled>
                        <i class="icon-sword"></i>
                        Start Battle
                    </button>
                </section>

                <div class="battle-arena hidden" id="battleArena">
                    <div class="arena-container">
                        <div class="player-side">
                            <h3 class="side-label">Your Team</h3>
                            <div class="arena-cards" id="playerArenaCards"></div>
                            <div class="total-power" id="playerTotalPower">Total: 0</div>
                        </div>
                        
                        <div class="vs-divider">
                            <span class="vs-text">VS</span>
                            <div class="battle-effect" id="battleEffect"></div>
                        </div>
                        
                        <div class="opponent-side">
                            <h3 class="side-label">Opponent</h3>
                            <div class="arena-cards" id="opponentArenaCards"></div>
                            <div class="total-power" id="opponentTotalPower">Total: 0</div>
                        </div>
                    </div>
                    
                    <div class="battle-result hidden" id="battleResult">
                        <h2 id="resultTitle"></h2>
                        <p id="resultMessage"></p>
                        <div class="reward-display hidden" id="rewardDisplay">
                            <span class="reward-amount" id="rewardAmount"></span>
                        </div>
                        <button class="btn btn-primary ripple" onclick="Battle.closeBattle()">
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    async renderBattleCards() {
        try {
            const response = await API.getCollection({ sortBy: 'power' });
            this.playerCards = response.success ? response.data : [];
            
            if (this.playerCards.length === 0) {
                return `
                    <div class="no-cards-message">
                        <p>You need cards to battle!</p>
                        <button class="btn btn-primary ripple" onclick="App.navigateTo('packs')">
                            Open Packs
                        </button>
                    </div>
                `;
            }

            return this.playerCards.map(card => this.renderBattleCard(card)).join('');
        } catch (error) {
            return '<p class="error-message">Failed to load cards</p>';
        }
    },

    renderBattleCard(card) {
        const isSelected = this.selectedCards.includes(card.id);
        const rarityClass = `rarity-${card.rarity}`;
        const glowClass = (card.rarity === 'legendary' || card.rarity === 'epic') ? 'card-glow' : '';
        
        return `
            <div class="battle-card ${rarityClass} ${glowClass} ${isSelected ? 'selected' : ''}"
                 data-card-id="${card.id}"
                 onclick="Battle.selectCard('${card.id}')">
                <div class="battle-card-inner">
                    <div class="card-avatar ${rarityClass}">
                        ${App.getCardEmoji(card.rarity)}
                    </div>
                    <h4 class="battle-card-name">${card.name}</h4>
                    <div class="battle-card-power">⚡ ${card.power}</div>
                    <span class="rarity-tag ${rarityClass}">${card.rarity}</span>
                </div>
                ${isSelected ? '<div class="selected-overlay">✓</div>' : ''}
            </div>
        `;
    },

    selectCard(cardId) {
        const index = this.selectedCards.indexOf(cardId);
        
        if (index > -1) {
            this.selectedCards.splice(index, 1);
        } else if (this.selectedCards.length < 3) {
            this.selectedCards.push(cardId);
        } else {
            App.showToast('Maximum 3 cards allowed!', 'info');
            return;
        }

        this.updateSelection();
        App.hapticFeedback('light');
    },

    updateSelection() {
        const count = document.getElementById('selectionCount');
        const startBtn = document.getElementById('startBattleBtn');
        const previewSlots = document.getElementById('previewSlots');

        count.textContent = `${this.selectedCards.length}/3 selected`;
        startBtn.disabled = this.selectedCards.length !== 3;

        document.querySelectorAll('.battle-card').forEach(card => {
            const cardId = card.dataset.cardId;
            card.classList.toggle('selected', this.selectedCards.includes(cardId));
            
            const overlay = card.querySelector('.selected-overlay');
            if (this.selectedCards.includes(cardId) && !overlay) {
                const overlayEl = document.createElement('div');
                overlayEl.className = 'selected-overlay';
                overlayEl.textContent = '✓';
                card.appendChild(overlayEl);
            } else if (!this.selectedCards.includes(cardId) && overlay) {
                overlay.remove();
            }
        });

        const slots = previewSlots.querySelectorAll('.preview-slot');
        slots.forEach((slot, i) => {
            if (this.selectedCards[i]) {
                const card = this.playerCards.find(c => c.id === this.selectedCards[i]);
                if (card) {
                    slot.innerHTML = `
                        <div class="preview-card-mini rarity-${card.rarity}">
                            ${App.getCardEmoji(card.rarity)}
                            <span>⚡${card.power}</span>
                        </div>
                    `;
                    slot.classList.remove('empty');
                }
            } else {
                slot.innerHTML = '?';
                slot.classList.add('empty');
            }
        });
    },

    async startBattle() {
        if (this.isBattling || this.selectedCards.length !== 3) return;
        this.isBattling = true;

        const arena = document.getElementById('battleArena');
        const playerCards = this.selectedCards.map(id => this.playerCards.find(c => c.id === id));
        
        arena.classList.remove('hidden');
        
        this.renderArenaCards(playerCards, 'player');
        App.hapticFeedback('heavy');
        
        await this.delay(1000);

        try {
            const response = await API.startBattle(this.selectedCards);
            
            if (response.success) {
                this.battleResult = response.data;
                
                await this.delay(500);
                this.renderArenaCards(response.data.opponentCards, 'opponent');
                App.hapticFeedback('medium');
                
                await this.delay(1000);
                await this.showBattleEffects();
                
                await this.delay(500);
                this.showResult();
            }
        } catch (error) {
            App.showToast(error.message || 'Battle failed', 'error');
            arena.classList.add('hidden');
        } finally {
            this.isBattling = false;
        }
    },

    renderArenaCards(cards, side) {
        const container = document.getElementById(`${side}ArenaCards`);
        const powerEl = document.getElementById(`${side}TotalPower`);
        
        container.innerHTML = cards.map(card => `
            <div class="arena-card rarity-${card.rarity} ${card.rarity === 'legendary' ? 'card-glow' : ''}">
                <div class="arena-card-avatar rarity-${card.rarity}">
                    ${App.getCardEmoji(card.rarity)}
                </div>
                <span class="arena-card-name">${card.name}</span>
                <span class="arena-card-power">⚡${card.power}</span>
            </div>
        `).join('');

        const totalPower = cards.reduce((sum, card) => sum + card.power, 0);
        powerEl.textContent = `Total: ${totalPower}`;
    },

    async showBattleEffects() {
        const effect = document.getElementById('battleEffect');
        effect.classList.add('active');
        
        for (let i = 0; i < 3; i++) {
            App.hapticFeedback('light');
            await this.delay(300);
        }
        
        effect.classList.remove('active');
    },

    showResult() {
        const result = document.getElementById('battleResult');
        const title = document.getElementById('resultTitle');
        const message = document.getElementById('resultMessage');
        const rewardDisplay = document.getElementById('rewardDisplay');
        const rewardAmount = document.getElementById('rewardAmount');

        result.classList.remove('hidden');

        if (this.battleResult.isWin) {
            title.textContent = '🏆 VICTORY!';
            title.className = 'victory';
            message.textContent = 'You defeated your opponent!';
            
            rewardDisplay.classList.remove('hidden');
            rewardAmount.textContent = `+${this.battleResult.reward.toLocaleString()} coins`;
            
            App.hapticFeedback('success');
        } else {
            title.textContent = '💀 DEFEAT';
            title.className = 'defeat';
            message.textContent = 'Better luck next time!';
            rewardDisplay.classList.add('hidden');
            
            App.hapticFeedback('error');
        }

        App.refreshUser();
    },

    closeBattle() {
        const arena = document.getElementById('battleArena');
        const result = document.getElementById('battleResult');
        
        result.classList.add('hidden');
        arena.classList.add('hidden');
        
        this.selectedCards = [];
        this.battleResult = null;
        
        this.render();
    }
};

window.Battle = Battle;
