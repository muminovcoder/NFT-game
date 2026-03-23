const Bonus = {
    async render() {
        const isClaimed = App.state.user?.dailyBonusClaimed;
        const timeUntil = this.getTimeUntilNext();

        App.elements.mainContent.innerHTML = `
            <div class="bonus-view">
                <header class="view-header">
                    <button class="back-btn ripple" onclick="App.navigateTo('dashboard')">
                        <i class="icon-back"></i>
                    </button>
                    <h1>Daily Bonus</h1>
                </header>

                <div class="bonus-content">
                    <div class="bonus-calendar">
                        <div class="calendar-header">
                            <h2>Claim Your Rewards</h2>
                            <p>Login daily to earn bonus coins!</p>
                        </div>
                        
                        <div class="streak-display">
                            <div class="streak-icon">🔥</div>
                            <div class="streak-info">
                                <span class="streak-count" id="streakCount">0</span>
                                <span class="streak-label">Day Streak</span>
                            </div>
                        </div>

                        <div class="rewards-grid">
                            ${this.renderDayRewards()}
                        </div>
                    </div>

                    <div class="claim-section">
                        ${isClaimed ? this.renderClaimedState() : this.renderAvailableState()}
                    </div>

                    <div class="bonus-history">
                        <h3>Recent Claims</h3>
                        <div class="history-items" id="bonusHistory">
                            ${this.renderBonusHistory()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (!isClaimed) {
            this.startTimerUpdate();
        }
    },

    renderDayRewards() {
        const rewards = [
            { day: 1, amount: 500, icon: '🪙' },
            { day: 2, amount: 750, icon: '🪙' },
            { day: 3, amount: 1000, icon: '💰' },
            { day: 4, amount: 1500, icon: '💰' },
            { day: 5, amount: 2000, icon: '💎' },
            { day: 6, amount: 2500, icon: '💎' },
            { day: 7, amount: 5000, icon: '👑' }
        ];

        const currentDay = 1;

        return rewards.map(r => `
            <div class="day-reward ${r.day <= currentDay ? 'completed' : ''} ${r.day === currentDay + 1 ? 'next' : ''}">
                <div class="day-icon">${r.icon}</div>
                <span class="day-number">Day ${r.day}</span>
                <span class="day-amount">${r.amount.toLocaleString()}</span>
                ${r.day <= currentDay ? '<span class="check-icon">✓</span>' : ''}
            </div>
        `).join('');
    },

    renderAvailableState() {
        return `
            <div class="claim-box available">
                <div class="claim-animation">
                    <div class="coin-rain">
                        ${Array(10).fill().map(() => '<span class="rain-coin">🪙</span>').join('')}
                    </div>
                </div>
                <h2>🎁 Bonus Available!</h2>
                <p>Claim your daily reward</p>
                <div class="reward-amount">
                    <span class="amount">+1,000</span>
                    <span class="currency">🪙</span>
                </div>
                <button class="btn btn-bonus ripple" onclick="Bonus.claimBonus()">
                    <i class="icon-gift"></i>
                    Claim Now
                </button>
            </div>
        `;
    },

    renderClaimedState() {
        const timeUntil = this.getTimeUntilNext();
        return `
            <div class="claim-box claimed">
                <div class="claimed-icon">✅</div>
                <h2>Already Claimed!</h2>
                <p>Come back tomorrow for more</p>
                <div class="timer-display">
                    <span class="timer-label">Next bonus in:</span>
                    <span class="timer-value" id="bonusTimer">${timeUntil}</span>
                </div>
            </div>
        `;
    },

    renderBonusHistory() {
        const history = JSON.parse(localStorage.getItem('bonusHistory') || '[]');
        
        if (history.length === 0) {
            return '<p class="empty-history">No bonus claims yet</p>';
        }

        return history.slice(0, 5).map(h => `
            <div class="history-item">
                <span class="history-amount">+${h.amount.toLocaleString()} 🪙</span>
                <span class="history-date">${new Date(h.date).toLocaleDateString()}</span>
            </div>
        `).join('');
    },

    getTimeUntilNext() {
        if (!App.state.user?.lastDailyBonus) return '23:59:59';
        
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
        setInterval(() => {
            const timer = document.getElementById('bonusTimer');
            if (timer) {
                timer.textContent = this.getTimeUntilNext();
                
                if (this.getTimeUntilNext() === '00:00:00') {
                    App.state.user.dailyBonusClaimed = false;
                    this.render();
                }
            }
        }, 1000);
    },

    async claimBonus() {
        try {
            App.setLoading(true);
            App.hapticFeedback('heavy');
            
            const response = await API.claimDailyBonus();
            
            if (response.success) {
                this.showClaimAnimation(response.data.bonus);
                await App.refreshUser();
                
                const history = JSON.parse(localStorage.getItem('bonusHistory') || '[]');
                history.unshift({
                    amount: response.data.bonus,
                    date: new Date().toISOString()
                });
                localStorage.setItem('bonusHistory', JSON.stringify(history.slice(0, 30)));
            }
        } catch (error) {
            App.showToast(error.message || 'Failed to claim bonus', 'error');
            this.render();
        } finally {
            App.setLoading(false);
        }
    },

    showClaimAnimation(bonus) {
        const claimBox = document.querySelector('.claim-box');
        if (claimBox) {
            claimBox.classList.add('claiming');
            
            setTimeout(() => {
                claimBox.innerHTML = `
                    <div class="claim-success">
                        <div class="success-coin">🪙</div>
                        <h2>+${bonus.toLocaleString()}</h2>
                        <p>Coins added to your balance!</p>
                    </div>
                `;
                claimBox.classList.remove('claiming');
                claimBox.classList.add('claimed');
            }, 1500);
        }
    }
};

window.Bonus = Bonus;
