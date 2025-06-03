// Constants for message patterns
const MESSAGE_PATTERNS = {
    RECEIVED_MONEY: {
        pattern: /You have received (\d+(?:,\d+)?) RWF from (.+?) \(\*+\d+\) .+?balance:(\d+(?:,\d+)?) RWF/i,
        type: 'received'
    },
    SENT_MONEY: {
        pattern: /(\d+(?:,\d+)?) RWF transferred to (.+?) \((\d+)\).+?Fee was: (\d+) RWF.+?balance: (\d+(?:,\d+)?) RWF/i,
        type: 'sent'
    },
    AIRTIME_PURCHASE: {
        pattern: /payment of (\d+(?:,\d+)?) RWF to Airtime.+?balance: (\d+(?:,\d+)?) RWF/i,
        type: 'airtime'
    },
    BUNDLE_PURCHASE: {
        pattern: /payment of (\d+(?:,\d+)?) RWF to Bundles.+?balance: (\d+(?:,\d+)?) RWF/i,
        type: 'bundles'
    },
    BUNDLE_CONFIRMATION: {
        pattern: /Umaze kugura (\d+(?:,\d+)?)Frw = (.+?) igura/i,
        type: 'bundles'
    }
};

// Utility functions
const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const parseAmount = (amountStr) => {
    return parseInt(amountStr.replace(/,/g, ''));
};

const formatDate = (dateStr, timeStr) => {
    const [day, month] = dateStr.split('/');
    const year = new Date().getFullYear();
    return `${day}/${month}/${year} ${timeStr}`;
};

// Main class for handling MoMo message analysis
class MoMoAnalyzer {
    constructor() {
        this.transactions = [];
        this.stats = {
            totalReceived: 0,
            totalSent: 0,
            receivedCount: 0,
            sentCount: 0,
            currentBalance: 0,
            lastUpdate: null
        };

        // DOM Elements
        this.elements = {
            messageInput: document.getElementById('messageInput'),
            analyzeButton: document.getElementById('analyzeButton'),
            clearButton: document.getElementById('clearButton'),
            resultsArea: document.getElementById('resultsArea'),
            totalMessages: document.getElementById('totalMessages'),
            moneyReceived: document.getElementById('moneyReceived'),
            moneySent: document.getElementById('moneySent'),
            currentBalance: document.getElementById('currentBalance'),
            receivedCount: document.getElementById('receivedCount'),
            sentCount: document.getElementById('sentCount'),
            balanceTimestamp: document.getElementById('balanceTimestamp'),
            transactionsBody: document.getElementById('transactionsBody'),
            filterButtons: document.querySelectorAll('.filter-btn')
        };

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.elements.analyzeButton.addEventListener('click', () => this.analyzeMessages());
        this.elements.clearButton.addEventListener('click', () => this.clearAll());
        this.elements.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.filterTransactions(e.target.dataset.filter));
        });
    }

    clearAll() {
        this.elements.messageInput.value = '';
        this.elements.resultsArea.classList.add('hidden');
        this.transactions = [];
        this.stats = {
            totalReceived: 0,
            totalSent: 0,
            receivedCount: 0,
            sentCount: 0,
            currentBalance: 0,
            lastUpdate: null
        };
    }

    parseMessages(text) {
        // Split messages by WhatsApp format timestamp pattern
        const messages = text.split(/\[\d{2}\/\d{2}, \d{2}:\d{2}\]/);
        const timestamps = text.match(/\[\d{2}\/\d{2}, \d{2}:\d{2}\]/g) || [];
        
        messages.forEach((message, index) => {
            if (!message.trim()) return;
            
            const timestamp = timestamps[index] || '';
            const [dateStr, timeStr] = timestamp.replace(/[\[\]]/g, '').split(', ');
            
            this.processMessage(message.trim(), dateStr, timeStr);
        });

        // Sort transactions by date (newest first)
        this.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    processMessage(message, dateStr, timeStr) {
        for (const [key, pattern] of Object.entries(MESSAGE_PATTERNS)) {
            const match = message.match(pattern.pattern);
            if (!match) continue;

            let transaction = {
                date: formatDate(dateStr, timeStr),
                type: pattern.type,
                amount: 0,
                details: '',
                balance: 0
            };

            switch (key) {
                case 'RECEIVED_MONEY':
                    transaction.amount = parseAmount(match[1]);
                    transaction.details = `From ${match[2]}`;
                    transaction.balance = parseAmount(match[3]);
                    this.stats.totalReceived += transaction.amount;
                    this.stats.receivedCount++;
                    break;

                case 'SENT_MONEY':
                    const amount = parseAmount(match[1]);
                    const fee = parseAmount(match[4]);
                    transaction.amount = amount + fee;
                    transaction.details = `To ${match[2]} (${match[3]})`;
                    transaction.balance = parseAmount(match[5]);
                    this.stats.totalSent += transaction.amount;
                    this.stats.sentCount++;
                    break;

                case 'AIRTIME_PURCHASE':
                    transaction.amount = parseAmount(match[1]);
                    transaction.details = 'Airtime Purchase';
                    transaction.balance = parseAmount(match[2]);
                    this.stats.totalSent += transaction.amount;
                    break;

                case 'BUNDLE_PURCHASE':
                    transaction.amount = parseAmount(match[1]);
                    transaction.details = 'Data Bundle Purchase';
                    transaction.balance = parseAmount(match[2]);
                    this.stats.totalSent += transaction.amount;
                    break;

                case 'BUNDLE_CONFIRMATION':
                    // Skip bundle confirmations as they're duplicates
                    return;
            }

            // Update current balance if this is the most recent transaction
            if (!this.stats.lastUpdate || new Date(transaction.date) > new Date(this.stats.lastUpdate)) {
                this.stats.currentBalance = transaction.balance;
                this.stats.lastUpdate = transaction.date;
            }

            this.transactions.push(transaction);
        }
    }

    updateUI() {
        // Update summary statistics
        this.elements.totalMessages.textContent = this.transactions.length;
        this.elements.moneyReceived.textContent = `${formatNumber(this.stats.totalReceived)} RWF`;
        this.elements.moneySent.textContent = `${formatNumber(this.stats.totalSent)} RWF`;
        this.elements.currentBalance.textContent = `${formatNumber(this.stats.currentBalance)} RWF`;
        this.elements.receivedCount.textContent = `(${this.stats.receivedCount} transactions)`;
        this.elements.sentCount.textContent = `(${this.stats.sentCount} transactions)`;
        this.elements.balanceTimestamp.textContent = this.stats.lastUpdate ? `Last updated: ${this.stats.lastUpdate}` : 'Not available';

        // Show results area
        this.elements.resultsArea.classList.remove('hidden');

        // Update transactions table
        this.updateTransactionsTable();
    }

    updateTransactionsTable(filter = 'all') {
        this.elements.transactionsBody.innerHTML = '';
        
        const filteredTransactions = this.transactions.filter(transaction => {
            return filter === 'all' || transaction.type === filter;
        });

        filteredTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.dataset.type = transaction.type;
            
            row.innerHTML = `
                <td>${transaction.date}</td>
                <td>${this.getTransactionTypeName(transaction.type)}</td>
                <td>${transaction.type === 'received' ? '+' : '-'}${formatNumber(transaction.amount)} RWF</td>
                <td>${transaction.details}</td>
                <td>${formatNumber(transaction.balance)} RWF</td>
            `;
            
            this.elements.transactionsBody.appendChild(row);
        });
    }

    getTransactionTypeName(type) {
        const names = {
            received: 'Money Received',
            sent: 'Money Sent',
            airtime: 'Airtime Purchase',
            bundles: 'Data Bundle',
            other: 'Other Transaction'
        };
        return names[type] || type;
    }

    filterTransactions(type) {
        this.elements.filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === type);
        });
        this.updateTransactionsTable(type);
    }

    analyzeMessages() {
        const text = this.elements.messageInput.value.trim();
        if (!text) {
            alert('Please paste some messages first!');
            return;
        }

        // Reset data
        this.transactions = [];
        this.stats = {
            totalReceived: 0,
            totalSent: 0,
            receivedCount: 0,
            sentCount: 0,
            currentBalance: 0,
            lastUpdate: null
        };

        // Process messages
        this.parseMessages(text);

        // Update UI
        this.updateUI();
    }
}

// Initialize the analyzer when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MoMoAnalyzer();
});
