const Withdraw = {
    selectedAmount: null,
    step: 1,
    withdrawalHistory: [],

    withdrawalPackages: [
        { coins: 10000, som: 10000, label: '10K' },
        { coins: 25000, som: 25000, label: '25K' },
        { coins: 50000, som: 50000, label: '50K' },
        { coins: 100000, som: 100000, label: '100K' },
        { coins: 250000, som: 250000, label: '250K' },
        { coins: 500000, som: 500000, label: '500K' },
        { coins: 1000000, som: 1000000, label: '1M' },
        { coins: 2500000, som: 2500000, label: '2.5M' },
        { coins: 5000000, som: 5000000, label: '5M' },
        { coins: 10000000, som: 10000000, label: '10M' }
    ],

    async render() {
        App.elements.mainContent.innerHTML = `
            <div class="withdraw-view">
                <header class="view-header">
                    <button class="back-btn ripple" onclick="App.navigateTo('dashboard')">
                        <i class="icon-back"></i>
                    </button>
                    <h1>Withdraw</h1>
                </header>

                <div class="withdraw-content">
                    <div class="balance-display">
                        <div class="balance-icon">🪙</div>
                        <div class="balance-info">
                            <span class="balance-label">Your Balance</span>
                            <span class="balance-amount" id="withdrawBalance">
                                ${App.formatNumber(App.state.user?.coins)} coins
                            </span>
                        </div>
                    </div>

                    <div class="withdraw-steps">
                        <div class="step ${this.step >= 1 ? 'active' : ''}" data-step="1">
                            <span class="step-number">1</span>
                            <span class="step-label">Select Amount</span>
                        </div>
                        <div class="step-line ${this.step >= 2 ? 'active' : ''}"></div>
                        <div class="step ${this.step >= 2 ? 'active' : ''}" data-step="2">
                            <span class="step-number">2</span>
                            <span class="step-label">Enter Details</span>
                        </div>
                        <div class="step-line ${this.step >= 3 ? 'active' : ''}"></div>
                        <div class="step ${this.step >= 3 ? 'active' : ''}" data-step="3">
                            <span class="step-number">3</span>
                            <span class="step-label">Confirm</span>
                        </div>
                    </div>

                    <div class="step-content" id="stepContent">
                        ${this.renderStep1()}
                    </div>

                    <div class="withdraw-history">
                        <h3>Recent Withdrawals</h3>
                        <div class="history-list" id="historyList">
                            ${await this.loadHistory()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderStep1() {
        const userCoins = App.state.user?.coins || 0;
        
        return `
            <div class="packages-grid">
                ${this.withdrawalPackages.map(pkg => {
                    const canAfford = userCoins >= pkg.coins;
                    return `
                        <div class="package-card ${canAfford ? 'available' : 'disabled'}"
                             onclick="${canAfford ? `Withdraw.selectPackage(${pkg.coins})` : ''}">
                            <div class="package-amount">${pkg.label}</div>
                            <div class="package-coins">${pkg.coins.toLocaleString()} 🪙</div>
                            <div class="package-som">= ${pkg.som.toLocaleString()} so'm</div>
                            ${!canAfford ? '<div class="package-lock">🔒</div>' : ''}
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="min-notice">
                <i class="icon-info"></i>
                Minimum withdrawal: 10,000 coins (10,000 so'm)
            </div>
        `;
    },

    renderStep2() {
        return `
            <div class="form-section">
                <h3>Payment Details</h3>
                <p class="form-info">Enter your bank card details for the transfer</p>
                
                <div class="form-group">
                    <label for="cardNumber">Card Number (16 digits)</label>
                    <input type="text" id="cardNumber" class="form-input" 
                           placeholder="8600 1234 5678 9012" 
                           maxlength="19"
                           oninput="Withdraw.formatCardNumber(this)">
                    <span class="input-error" id="cardError"></span>
                </div>

                <div class="form-group">
                    <label for="fullName">Full Name</label>
                    <input type="text" id="fullName" class="form-input" 
                           placeholder="As per your passport">
                    <span class="input-error" id="nameError"></span>
                </div>

                <div class="selected-amount-display">
                    <span>Selected Amount:</span>
                    <strong>${this.selectedAmount?.toLocaleString()} coins</strong>
                    <span>= ${this.selectedAmount?.toLocaleString()} so'm</span>
                </div>

                <div class="form-actions">
                    <button class="btn btn-secondary ripple" onclick="Withdraw.goToStep(1)">
                        Back
                    </button>
                    <button class="btn btn-primary ripple" onclick="Withdraw.goToStep(3)">
                        Continue
                    </button>
                </div>
            </div>
        `;
    },

    renderStep3() {
        const cardNumber = document.getElementById('cardNumber')?.value || '';
        const fullName = document.getElementById('fullName')?.value || '';
        
        return `
            <div class="confirm-section">
                <h3>Confirm Withdrawal</h3>
                
                <div class="confirm-details">
                    <div class="confirm-row">
                        <span class="confirm-label">Amount:</span>
                        <span class="confirm-value coins">${this.selectedAmount?.toLocaleString()} 🪙</span>
                    </div>
                    <div class="confirm-row">
                        <span class="confirm-label">You'll Receive:</span>
                        <span class="confirm-value som">${this.selectedAmount?.toLocaleString()} so'm</span>
                    </div>
                    <div class="confirm-row">
                        <span class="confirm-label">Card Number:</span>
                        <span class="confirm-value">${this.formatDisplayCard(cardNumber)}</span>
                    </div>
                    <div class="confirm-row">
                        <span class="confirm-label">Recipient:</span>
                        <span class="confirm-value">${fullName}</span>
                    </div>
                </div>

                <div class="confirm-warning">
                    <i class="icon-warning"></i>
                    <p>Please confirm all details are correct. Withdrawals cannot be reversed.</p>
                </div>

                <div class="form-actions">
                    <button class="btn btn-secondary ripple" onclick="Withdraw.goToStep(2)">
                        Back
                    </button>
                    <button class="btn btn-success ripple" onclick="Withdraw.submitWithdrawal()">
                        <i class="icon-check"></i>
                        Confirm Withdraw
                    </button>
                </div>
            </div>
        `;
    },

    async loadHistory() {
        try {
            const response = await API.getWithdrawHistory();
            if (response.success) {
                this.withdrawalHistory = response.data || [];
            }
        } catch (error) {
            this.withdrawalHistory = [];
        }

        if (this.withdrawalHistory.length === 0) {
            return '<p class="empty-history">No withdrawal history</p>';
        }

        return this.withdrawalHistory.slice(0, 5).map(w => `
            <div class="history-item ${w.status}">
                <div class="history-info">
                    <span class="history-amount">${w.amount.toLocaleString()} 🪙</span>
                    <span class="history-date">${new Date(w.createdAt).toLocaleDateString()}</span>
                </div>
                <span class="history-status status-${w.status}">${w.status}</span>
            </div>
        `).join('');
    },

    selectPackage(coins) {
        this.selectedAmount = coins;
        this.goToStep(2);
        App.hapticFeedback('light');
    },

    goToStep(step) {
        if (step === 3) {
            if (!this.validateForm()) {
                return;
            }
        }

        this.step = step;
        const content = document.getElementById('stepContent');
        
        switch(step) {
            case 1:
                content.innerHTML = this.renderStep1();
                break;
            case 2:
                content.innerHTML = this.renderStep2();
                break;
            case 3:
                content.innerHTML = this.renderStep3();
                break;
        }

        this.updateStepIndicators();
    },

    updateStepIndicators() {
        document.querySelectorAll('.step').forEach(el => {
            const stepNum = parseInt(el.dataset.step);
            el.classList.toggle('active', stepNum <= this.step);
        });

        document.querySelectorAll('.step-line').forEach(el => {
            el.classList.toggle('active', this.step > 2);
        });
    },

    formatCardNumber(input) {
        let value = input.value.replace(/\D/g, '');
        value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        input.value = value.substring(0, 19);
    },

    validateForm() {
        let isValid = true;
        
        const cardInput = document.getElementById('cardNumber');
        const nameInput = document.getElementById('fullName');
        const cardError = document.getElementById('cardError');
        const nameError = document.getElementById('nameError');

        const cardValue = cardInput?.value.replace(/\s/g, '') || '';
        
        if (!cardValue || cardValue.length !== 16 || !/^\d+$/.test(cardValue)) {
            if (cardError) cardError.textContent = 'Enter a valid 16-digit card number';
            if (cardInput) cardInput.classList.add('error');
            isValid = false;
        } else {
            if (cardError) cardError.textContent = '';
            if (cardInput) cardInput.classList.remove('error');
        }

        if (!nameInput?.value || nameInput.value.length < 3) {
            if (nameError) nameError.textContent = 'Enter your full name';
            if (nameInput) nameInput.classList.add('error');
            isValid = false;
        } else {
            if (nameError) nameError.textContent = '';
            if (nameInput) nameInput.classList.remove('error');
        }

        return isValid;
    },

    formatDisplayCard(card) {
        if (!card) return '****';
        const cleaned = card.replace(/\s/g, '');
        return '****'.repeat(3) + cleaned.slice(-4);
    },

    async submitWithdrawal() {
        const cardNumber = document.getElementById('cardNumber')?.value.replace(/\s/g, '') || '';
        const fullName = document.getElementById('fullName')?.value || '';

        try {
            App.setLoading(true);
            
            const response = await API.requestWithdraw(
                this.selectedAmount,
                cardNumber,
                fullName
            );

            if (response.success) {
                await App.refreshUser();
                this.showSuccess();
            }
        } catch (error) {
            App.showToast(error.message || 'Withdrawal request failed', 'error');
        } finally {
            App.setLoading(false);
        }
    },

    showSuccess() {
        const content = document.getElementById('stepContent');
        content.innerHTML = `
            <div class="success-section">
                <div class="success-icon">✅</div>
                <h3>Withdrawal Requested!</h3>
                <p>Your withdrawal of <strong>${this.selectedAmount?.toLocaleString()} so'm</strong> has been submitted.</p>
                <p class="success-note">You will be notified once it's processed.</p>
                
                <div class="new-balance">
                    <span>New Balance:</span>
                    <strong>${App.formatNumber(App.state.user?.coins)} coins</strong>
                </div>

                <button class="btn btn-primary ripple" onclick="Withdraw.reset()">
                    Done
                </button>
            </div>
        `;
    },

    reset() {
        this.step = 1;
        this.selectedAmount = null;
        this.render();
    }
};

window.Withdraw = Withdraw;
