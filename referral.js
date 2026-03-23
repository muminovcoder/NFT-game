const Referral = {
    referralInfo: null,

    async render() {
        App.elements.mainContent.innerHTML = `
            <div class="referral-view">
                <header class="view-header">
                    <button class="back-btn ripple" onclick="App.navigateTo('dashboard')">
                        <i class="icon-back"></i>
                    </button>
                    <h1>Referral</h1>
                </header>

                <div class="referral-content">
                    <div class="referral-hero">
                        <div class="hero-icon">👥</div>
                        <h2>Invite Friends, Earn Coins!</h2>
                        <p>Share your referral link and get rewarded for every friend who joins</p>
                    </div>

                    <div class="referral-stats">
                        <div class="stat-card">
                            <div class="stat-icon">🎁</div>
                            <span class="stat-value" id="refCount">-</span>
                            <span class="stat-label">Referrals</span>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🪙</div>
                            <span class="stat-value" id="refEarnings">-</span>
                            <span class="stat-label">Total Earned</span>
                        </div>
                    </div>

                    <div class="reward-info">
                        <h3>How it works</h3>
                        <div class="reward-steps">
                            <div class="reward-step">
                                <span class="step-num">1</span>
                                <div class="step-content">
                                    <h4>Share Your Link</h4>
                                    <p>Send your unique referral link to friends</p>
                                </div>
                            </div>
                            <div class="reward-step">
                                <span class="step-num">2</span>
                                <div class="step-content">
                                    <h4>Friend Joins</h4>
                                    <p>They create an account using your link</p>
                                </div>
                            </div>
                            <div class="reward-step">
                                <span class="step-num">3</span>
                                <div class="step-content">
                                    <h4>Earn Rewards</h4>
                                    <p>Get 500 coins for each referral!</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="link-section">
                        <h3>Your Referral Link</h3>
                        <div class="link-box">
                            <input type="text" id="referralLink" class="link-input" readonly value="Loading...">
                            <button class="btn btn-copy ripple" onclick="Referral.copyLink()">
                                <i class="icon-copy"></i>
                                Copy
                            </button>
                        </div>
                    </div>

                    <div class="share-buttons">
                        <button class="share-btn telegram ripple" onclick="Referral.shareToTelegram()">
                            <i class="icon-telegram"></i>
                            Telegram
                        </button>
                        <button class="share-btn clipboard ripple" onclick="Referral.copyLink()">
                            <i class="icon-copy"></i>
                            Copy Link
                        </button>
                    </div>

                    <div class="referral-leaderboard">
                        <h3>Top Referrers</h3>
                        <div class="leaderboard-list" id="leaderboard">
                            ${this.renderLeaderboard()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        await this.loadReferralInfo();
    },

    async loadReferralInfo() {
        try {
            const response = await API.getReferralInfo();
            if (response.success) {
                this.referralInfo = response.data;
                this.updateUI();
            }
        } catch (error) {
            console.error('Failed to load referral info:', error);
            this.referralInfo = {
                referralLink: `https://t.me/${window.location.hostname}/start?ref=${App.state.user?.id}`,
                totalReferrals: App.state.user?.referrals || 0,
                earnedCoins: App.state.user?.referralCoins || 0
            };
            this.updateUI();
        }
    },

    updateUI() {
        const linkInput = document.getElementById('referralLink');
        const countEl = document.getElementById('refCount');
        const earningsEl = document.getElementById('refEarnings');

        if (linkInput) linkInput.value = this.referralInfo?.referralLink || '';
        if (countEl) countEl.textContent = this.referralInfo?.totalReferrals || 0;
        if (earningsEl) earningsEl.textContent = (this.referralInfo?.earnedCoins || 0).toLocaleString();
    },

    copyLink() {
        const linkInput = document.getElementById('referralLink');
        if (!linkInput) return;

        navigator.clipboard.writeText(linkInput.value).then(() => {
            App.showToast('Link copied to clipboard!', 'success');
            App.hapticFeedback('light');
        }).catch(() => {
            linkInput.select();
            document.execCommand('copy');
            App.showToast('Link copied!', 'success');
        });
    },

    shareToTelegram() {
        const link = document.getElementById('referralLink')?.value;
        const text = encodeURIComponent(`🎮 Join me in this awesome NFT Card Game!\n\n${link}\n\nUse my referral link and we both get coins! 🪙`);
        window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`, '_blank');
    },

    renderLeaderboard() {
        const leaderboard = [
            { rank: 1, name: 'CryptoKing', referrals: 156, avatar: '👑' },
            { rank: 2, name: 'NFTMaster', referrals: 98, avatar: '🥈' },
            { rank: 3, name: 'CardCollector', referrals: 74, avatar: '🥉' },
            { rank: 4, name: 'GamerPro', referrals: 52, avatar: '🎮' },
            { rank: 5, name: 'RewardHunter', referrals: 45, avatar: '🏆' }
        ];

        const userRank = this.getUserRank();
        if (userRank) {
            leaderboard.push({
                rank: 'You',
                name: App.state.user?.username || 'You',
                referrals: this.referralInfo?.totalReferrals || 0,
                avatar: '👤'
            });
        }

        return leaderboard.map((entry, i) => `
            <div class="leaderboard-item ${entry.name === (App.state.user?.username || 'You') ? 'highlight' : ''}">
                <span class="rank">${entry.rank}</span>
                <span class="avatar">${entry.avatar}</span>
                <span class="name">${entry.name}</span>
                <span class="referrals">${entry.referrals} refs</span>
            </div>
        `).join('');
    },

    getUserRank() {
        return 6;
    }
};

window.Referral = Referral;
