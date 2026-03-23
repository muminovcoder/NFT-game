const Admin = {
    pendingWithdrawals: [],
    processedWithdrawals: [],
    isAdmin: false,
    adminPassword: 'admin123',

    async checkAdmin() {
        const savedPassword = localStorage.getItem('adminPassword');
        if (savedPassword === this.adminPassword) {
            this.isAdmin = true;
            return true;
        }
        return false;
    },

    async showAdminLogin() {
        const content = `
            <div class="admin-login">
                <div class="login-icon">🔐</div>
                <h2>Admin Access</h2>
                <p>Enter admin password to continue</p>
                
                <div class="form-group">
                    <input type="password" id="adminPassword" class="form-input" placeholder="Admin Password">
                </div>
                
                <button class="btn btn-primary ripple" onclick="Admin.login()">
                    Login
                </button>
                
                <p class="demo-note">Demo password: admin123</p>
            </div>
        `;
        App.showModal(content);
    },

    async login() {
        const password = document.getElementById('adminPassword')?.value;
        
        if (password === this.adminPassword) {
            this.isAdmin = true;
            localStorage.setItem('adminPassword', password);
            App.closeModal();
            await this.renderAdminPanel();
        } else {
            App.showToast('Invalid password', 'error');
        }
    },

    logout() {
        this.isAdmin = false;
        localStorage.removeItem('adminPassword');
        App.navigateTo('dashboard');
    },

    async renderAdminPanel() {
        App.elements.mainContent.innerHTML = `
            <div class="admin-view">
                <header class="view-header">
                    <button class="back-btn ripple" onclick="App.navigateTo('dashboard')">
                        <i class="icon-back"></i>
                    </button>
                    <h1>Admin Panel</h1>
                    <button class="btn btn-danger ripple" onclick="Admin.logout()">
                        Logout
                    </button>
                </header>

                <div class="admin-tabs">
                    <button class="tab-btn active" onclick="Admin.switchTab('withdrawals')">
                        Withdrawals (${this.pendingWithdrawals.length})
                    </button>
                    <button class="tab-btn" onclick="Admin.switchTab('users')">
                        Users
                    </button>
                    <button class="tab-btn" onclick="Admin.switchTab('stats')">
                        Statistics
                    </button>
                </div>

                <div class="admin-content">
                    <div class="tab-panel active" id="withdrawalsPanel">
                        ${await this.renderWithdrawals()}
                    </div>
                    <div class="tab-panel" id="usersPanel">
                        ${this.renderUsers()}
                    </div>
                    <div class="tab-panel" id="statsPanel">
                        ${this.renderStats()}
                    </div>
                </div>
            </div>
        `;

        this.loadWithdrawals();
    },

    switchTab(tab) {
        document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.toLowerCase().includes(tab));
        });

        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tab}Panel`);
        });
    },

    async loadWithdrawals() {
        this.pendingWithdrawals = JSON.parse(localStorage.getItem('pendingWithdrawals') || '[]')
            .filter(w => w.status === 'pending');
        this.processedWithdrawals = JSON.parse(localStorage.getItem('pendingWithdrawals') || '[]')
            .filter(w => w.status !== 'pending');

        this.updateWithdrawalCount();
    },

    updateWithdrawalCount() {
        const badge = document.querySelector('.admin-tabs .tab-btn:first-child');
        if (badge) {
            badge.textContent = `Withdrawals (${this.pendingWithdrawals.length})`;
        }
    },

    renderWithdrawals() {
        if (this.pendingWithdrawals.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">✅</div>
                    <h3>No Pending Withdrawals</h3>
                    <p>All withdrawal requests have been processed</p>
                </div>
            `;
        }

        return `
            <div class="withdrawals-list">
                ${this.pendingWithdrawals.map(w => this.renderWithdrawalCard(w)).join('')}
            </div>
        `;
    },

    renderWithdrawalCard(withdrawal) {
        const formattedDate = new Date(withdrawal.createdAt).toLocaleString();
        
        return `
            <div class="withdrawal-card" id="withdrawal-${withdrawal.id}">
                <div class="withdrawal-header">
                    <span class="withdrawal-id">#${withdrawal.id}</span>
                    <span class="withdrawal-date">${formattedDate}</span>
                </div>
                
                <div class="withdrawal-details">
                    <div class="detail-row">
                        <span class="detail-label">User:</span>
                        <span class="detail-value">
                            <a href="#" onclick="Admin.viewUser(${withdrawal.userId})">
                                @${withdrawal.username || 'Unknown'}
                            </a>
                            <span class="user-id">(ID: ${withdrawal.userId})</span>
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Amount:</span>
                        <span class="detail-value coins-highlight">
                            ${withdrawal.amount.toLocaleString()} 🪙
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">UZS Amount:</span>
                        <span class="detail-value som-highlight">
                            ${withdrawal.somAmount.toLocaleString()} so'm
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Card:</span>
                        <span class="detail-value">${withdrawal.cardNumber}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Name:</span>
                        <span class="detail-value">${withdrawal.fullName}</span>
                    </div>
                </div>

                <div class="withdrawal-actions">
                    <button class="btn btn-success ripple" onclick="Admin.approveWithdrawal('${withdrawal.id}')">
                        ✅ Approve
                    </button>
                    <button class="btn btn-danger ripple" onclick="Admin.rejectWithdrawal('${withdrawal.id}')">
                        ❌ Reject
                    </button>
                </div>
            </div>
        `;
    },

    async approveWithdrawal(withdrawalId) {
        if (!confirm('Are you sure you want to APPROVE this withdrawal?')) return;

        try {
            const withdrawal = this.pendingWithdrawals.find(w => w.id === withdrawalId);
            if (!withdrawal) return;

            withdrawal.status = 'approved';
            withdrawal.processedAt = new Date().toISOString();

            const allWithdrawals = JSON.parse(localStorage.getItem('pendingWithdrawals') || '[]');
            const index = allWithdrawals.findIndex(w => w.id === withdrawalId);
            if (index > -1) {
                allWithdrawals[index] = withdrawal;
            }
            localStorage.setItem('pendingWithdrawals', JSON.stringify(allWithdrawals));

            const card = document.getElementById(`withdrawal-${withdrawalId}`);
            if (card) {
                card.classList.add('approved');
                card.querySelector('.withdrawal-actions').innerHTML = '<span class="status-badge approved">✅ Approved</span>';
            }

            this.pendingWithdrawals = this.pendingWithdrawals.filter(w => w.id !== withdrawalId);
            this.updateWithdrawalCount();

            App.showToast('Withdrawal approved!', 'success');
            this.sendNotification(withdrawal.userId, 'Withdrawal Approved!', `Your withdrawal of ${withdrawal.somAmount.toLocaleString()} so'm has been approved.`);
        } catch (error) {
            App.showToast('Failed to approve withdrawal', 'error');
        }
    },

    async rejectWithdrawal(withdrawalId) {
        const reason = prompt('Enter rejection reason (optional):') || 'Request rejected by admin';

        try {
            const withdrawal = this.pendingWithdrawals.find(w => w.id === withdrawalId);
            if (!withdrawal) return;

            const user = MockAPI.user;
            user.coins += withdrawal.amount;
            MockAPI.saveCards();

            withdrawal.status = 'rejected';
            withdrawal.rejectReason = reason;
            withdrawal.processedAt = new Date().toISOString();

            const allWithdrawals = JSON.parse(localStorage.getItem('pendingWithdrawals') || '[]');
            const index = allWithdrawals.findIndex(w => w.id === withdrawalId);
            if (index > -1) {
                allWithdrawals[index] = withdrawal;
            }
            localStorage.setItem('pendingWithdrawals', JSON.stringify(allWithdrawals));

            const card = document.getElementById(`withdrawal-${withdrawalId}`);
            if (card) {
                card.classList.add('rejected');
                card.querySelector('.withdrawal-actions').innerHTML = `
                    <span class="status-badge rejected">❌ Rejected</span>
                    <span class="reject-reason">${reason}</span>
                `;
            }

            this.pendingWithdrawals = this.pendingWithdrawals.filter(w => w.id !== withdrawalId);
            this.updateWithdrawalCount();

            App.showToast('Withdrawal rejected. Coins returned to user.', 'info');
            this.sendNotification(withdrawal.userId, 'Withdrawal Rejected', `Your withdrawal was rejected. ${withdrawal.amount.toLocaleString()} coins have been returned to your balance.`);
        } catch (error) {
            App.showToast('Failed to reject withdrawal', 'error');
        }
    },

    sendNotification(userId, title, message) {
        console.log(`[NOTIFICATION] To User ${userId}: ${title} - ${message}`);
    },

    renderUsers() {
        const users = [
            { id: MockAPI.user.id, username: MockAPI.user.username, coins: MockAPI.user.coins, cards: MockAPI.user.totalCards }
        ];

        return `
            <div class="users-list">
                ${users.map(user => `
                    <div class="user-card">
                        <div class="user-info">
                            <span class="user-avatar">👤</span>
                            <div class="user-details">
                                <span class="username">@${user.username}</span>
                                <span class="user-id">ID: ${user.id}</span>
                            </div>
                        </div>
                        <div class="user-stats">
                            <div class="user-stat">
                                <span class="stat-value">${user.coins.toLocaleString()}</span>
                                <span class="stat-label">🪙 Coins</span>
                            </div>
                            <div class="user-stat">
                                <span class="stat-value">${user.cards}</span>
                                <span class="stat-label">🃏 Cards</span>
                            </div>
                        </div>
                        <div class="user-actions">
                            <button class="btn btn-secondary ripple" onclick="Admin.viewUser(${user.id})">
                                View
                            </button>
                            <button class="btn btn-warning ripple" onclick="Admin.addCoins(${user.id})">
                                + Add
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderStats() {
        const totalWithdrawals = JSON.parse(localStorage.getItem('pendingWithdrawals') || '[]');
        const approved = totalWithdrawals.filter(w => w.status === 'approved');
        const rejected = totalWithdrawals.filter(w => w.status === 'rejected');
        
        const totalApproved = approved.reduce((sum, w) => sum + w.amount, 0);
        const totalRejected = rejected.reduce((sum, w) => sum + w.amount, 0);

        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <span class="stat-value">1</span>
                    <span class="stat-label">Total Users</span>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🃏</div>
                    <span class="stat-value">${MockAPI.cards.length}</span>
                    <span class="stat-label">Total Cards</span>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">✅</div>
                    <span class="stat-value">${approved.length}</span>
                    <span class="stat-label">Approved Withdrawals</span>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">❌</div>
                    <span class="stat-value">${rejected.length}</span>
                    <span class="stat-label">Rejected Withdrawals</span>
                </div>
                <div class="stat-card highlight">
                    <div class="stat-icon">💰</div>
                    <span class="stat-value">${(totalApproved / 1000).toFixed(1)}K</span>
                    <span class="stat-label">Total Withdrawn</span>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🪙</div>
                    <span class="stat-value">${MockAPI.user.coins.toLocaleString()}</span>
                    <span class="stat-label">Total Coins in System</span>
                </div>
            </div>
        `;
    },

    viewUser(userId) {
        App.showToast('User profile view coming soon', 'info');
    },

    async addCoins(userId) {
        const amount = prompt('Enter amount of coins to add:');
        if (!amount || isNaN(amount)) return;

        MockAPI.user.coins += parseInt(amount);
        MockAPI.saveCards();
        await App.refreshUser();

        App.showToast(`Added ${parseInt(amount).toLocaleString()} coins!`, 'success');
        this.renderAdminPanel();
    }
};

window.Admin = Admin;
