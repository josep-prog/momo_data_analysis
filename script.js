// Message Analyzer - Junior Friendly Version
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const messageInput = document.getElementById('messageInput');
    const analyzeBtn = document.getElementById('analyzeButton');
    const messageCount = document.getElementById('messageCount');
    const dashboard = document.getElementById('dashboard');
    
    // Summary Cards
    const totalMessagesEl = document.getElementById('totalMessages');
    const moneyReceivedEl = document.getElementById('moneyReceived');
    const moneySentEl = document.getElementById('moneySent');
    const currentBalanceEl = document.getElementById('currentBalance');
    
    // Charts
    const typeChart = document.getElementById('typeChart');
    const amountChart = document.getElementById('amountChart');
    const pieLegend = document.getElementById('pieLegend');
    
    // Transactions Table
    const transactionsBody = document.getElementById('transactionsBody');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    // Data Storage
    let allMessages = [];
    let transactions = [];
    let currentBalance = 0;
    
    // Event Listeners
    analyzeBtn.addEventListener('click', analyzeMessages);
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => filterTransactions(btn.dataset.filter));
    });
    
    // Main Analysis Function
    function analyzeMessages() {
        const text = messageInput.value.trim();
        if (!text) {
            alert('Please paste some messages first!');
            return;
        }
        
        // Split messages by timestamp pattern
        const messages = text.split(/(?=\[\d{2}:\d{2}, \d{2}\/\d{2}\/\d{4}\] .*?: )/);
        const filteredMessages = messages.filter(msg => msg.trim() !== '');
        
        // Process messages
        const transactions = [];
        let totalReceived = 0;
        let totalSent = 0;
        let currentBalance = 0;

        filteredMessages.forEach(message => {
            const transaction = processMessage(message);
            if (transaction) {
                transactions.push(transaction);
                if (transaction.type === 'received') {
                    totalReceived += transaction.amount;
                } else {
                    totalSent += transaction.amount;
                }
                if (transaction.balance !== 'Unknown') {
                    currentBalance = transaction.balance;
                }
            }
        });
        
        // Update summary
        totalMessagesEl.textContent = filteredMessages.length;
        moneyReceivedEl.textContent = `${totalReceived} RWF`;
        moneySentEl.textContent = `${totalSent} RWF`;
        currentBalanceEl.textContent = `${currentBalance} RWF`;
        
        // Update transactions table
        updateTransactionsTable(transactions);
        
        // Show dashboard
        dashboard.classList.remove('hidden');
    }
    
    // Process individual message
    function processMessage(message) {
        // Extract timestamp and sender
        const metaMatch = message.match(/\[(\d{2}:\d{2}), (\d{2}\/\d{2}\/\d{4})\] (.*?): /);
        if (!metaMatch) return null;

        const time = metaMatch[1];
        const date = metaMatch[2];
        const sender = metaMatch[3];
        const content = message.substring(metaMatch[0].length).trim();

        // Process different message types
        if (content.includes('You have received') && content.includes('from')) {
            // Money received
            const amountMatch = content.match(/received (\d+) RWF/);
            const fromMatch = content.match(/from (.+?) \(/);
            const balanceMatch = content.match(/balance: (\d+) RWF/);
            
            if (amountMatch && balanceMatch) {
                return {
                    date,
                    time,
                    type: 'received',
                    amount: parseInt(amountMatch[1]),
                    details: fromMatch ? `From ${fromMatch[1]}` : 'Money received',
                    balance: parseInt(balanceMatch[1])
                };
            }
        } 
        else if (content.includes('transferred to') || content.includes('payment of')) {
            // Money sent or payment
            const amountMatch = content.match(/(\d+) RWF/);
            const toMatch = content.match(/to (.+?) \(/) || content.match(/to (.+?) with/);
            const feeMatch = content.match(/Fee was:? (\d+) RWF/);
            const balanceMatch = content.match(/balance: (\d+) RWF/) || content.match(/New balance: (\d+) RWF/);
            
            if (amountMatch && balanceMatch) {
                const amount = parseInt(amountMatch[1]);
                const fee = feeMatch ? parseInt(feeMatch[1]) : 0;
                let type = 'sent';
                
                if (content.includes('Airtime')) type = 'airtime';
                if (content.includes('Bundles')) type = 'bundles';

                return {
                    date,
                    time,
                    type,
                    amount: amount + fee,
                    details: toMatch ? `To ${toMatch[1]}` : 
                            content.includes('Airtime') ? 'Airtime purchase' :
                            content.includes('Bundles') ? 'Data bundle purchase' : 'Money sent',
                    balance: parseInt(balanceMatch[1])
                };
            }
        }
        else if (content.includes('Umaze kugura') || content.includes('gura')) {
            // Bundle purchase
            const amountMatch = content.match(/(\d+)Frw/) || content.match(/(\d+) RWF/);
            const detailsMatch = content.match(/= (.+?) igura/) || content.match(/= (.+?)\//);
            
            if (amountMatch) {
                return {
                    date,
                    time,
                    type: 'bundles',
                    amount: parseInt(amountMatch[1]),
                    details: detailsMatch ? detailsMatch[1] : 'Data bundle purchase',
                    balance: 'Unknown'
                };
            }
        }
        
        // If no transaction found, return null
        return null;
    }
    
    // Update transactions table
    function updateTransactionsTable(transactions) {
        // Sort transactions by date (newest first)
        transactions.sort((a, b) => {
            const dateA = new Date(a.date.split('/').reverse().join('-'));
            const dateB = new Date(b.date.split('/').reverse().join('-'));
            return dateB - dateA;
        });
        
        // Clear existing table
        transactionsBody.innerHTML = '';
        
        // Add transactions to table
        transactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.classList.add(transaction.type);
            
            row.innerHTML = `
                <td>${transaction.date} ${transaction.time}</td>
                <td>${getTypeName(transaction.type)}</td>
                <td>${transaction.type === 'received' ? '+' : '-'}${transaction.amount} RWF</td>
                <td>${transaction.details}</td>
                <td>${transaction.balance === 'Unknown' ? 'Unknown' : transaction.balance + ' RWF'}</td>
            `;
            
            transactionsBody.appendChild(row);
        });
    }
    
    // Filter transactions
    function filterTransactions(type) {
        const rows = transactionsBody.querySelectorAll('tr');
        
        rows.forEach(row => {
            if (type === 'all' || row.classList.contains(type)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
        
        // Update active button
        filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === type);
        });
    }
    
    // Helper functions
    function getTypeName(type) {
        const names = {
            received: 'Money Received',
            sent: 'Money Sent',
            airtime: 'Airtime',
            bundles: 'Data Bundle'
        };
        return names[type] || type;
    }
    
    function resetAnalysis() {
        allMessages = [];
        transactions = [];
        currentBalance = 0;
        
        // Clear UI elements
        totalMessagesEl.textContent = '0';
        moneyReceivedEl.textContent = '0 RWF';
        moneySentEl.textContent = '0 RWF';
        currentBalanceEl.textContent = '0 RWF';
        
        typeChart.innerHTML = '';
        amountChart.innerHTML = '';
        pieLegend.innerHTML = '';
        transactionsBody.innerHTML = '';
        
        // Reset filters
        filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === 'all');
        });
    }
});
