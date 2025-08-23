// Retirement Drawdown Projection Calculator
class RetirementCalculator {
    constructor() {
        this.initializeEventListeners();
        this.balanceChart = null;
        this.spendingChart = null;
        this.projectionData = [];
    }

    initializeEventListeners() {
        const calculateBtn = document.getElementById('calculate-btn');
        const inputs = document.querySelectorAll('input');
        
        calculateBtn.addEventListener('click', () => this.calculateProjection());
        
        // Auto-calculate on input change (with debounce)
        inputs.forEach(input => {
            input.addEventListener('input', this.debounce(() => this.calculateProjection(), 500));
            
            // Add currency formatting for currency inputs
            if (input.id.includes('starting-') || input.id === 'yearly-spend' || input.id === 'added-spend') {
                this.addCurrencyFormatting(input);
            }
        });

        // Initial calculation
        this.calculateProjection();
    }

    addCurrencyFormatting(input) {
        // Format currency inputs and handle parsing
        input.addEventListener('blur', () => {
            const value = this.parseCurrencyInput(input.value);
            if (!isNaN(value)) {
                input.value = this.formatCurrencyInput(value);
            }
        });
        
        input.addEventListener('focus', () => {
            // Remove formatting for easier editing
            const value = this.parseCurrencyInput(input.value);
            if (!isNaN(value)) {
                input.value = value.toString();
            }
        });
    }
    
    parseCurrencyInput(value) {
        // Remove commas, dollar signs, and spaces, then parse as float
        return parseFloat(value.toString().replace(/[,$\s]/g, '')) || 0;
    }
    
    formatCurrencyInput(value) {
        // Format number with commas
        return value.toLocaleString('en-US');
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    getInputValues() {
        return {
            rateOfReturn: parseFloat(document.getElementById('rate-of-return').value) / 100,
            inflationRate: parseFloat(document.getElementById('inflation-rate').value) / 100,
            yearlySpend: this.parseCurrencyInput(document.getElementById('yearly-spend').value),
            addedSpend: this.parseCurrencyInput(document.getElementById('added-spend').value) || 0,
            effectiveTaxRate: parseFloat(document.getElementById('effective-tax-rate').value) / 100,
            startingTaxDeferred: this.parseCurrencyInput(document.getElementById('starting-tax-deferred').value),
            startingRoth: this.parseCurrencyInput(document.getElementById('starting-roth').value) || 0,
            startingTaxable: this.parseCurrencyInput(document.getElementById('starting-taxable').value) || 0,
            projectionYears: parseInt(document.getElementById('projection-years').value)
        };
    }

    validateInputs(inputs) {
        const errors = [];
        
        if (inputs.rateOfReturn < 0 || inputs.rateOfReturn > 0.5) {
            errors.push('Rate of return should be between 0% and 50%');
        }
        
        if (inputs.inflationRate < 0 || inputs.inflationRate > 0.2) {
            errors.push('Inflation rate should be between 0% and 20%');
        }
        
        if (inputs.yearlySpend <= 0) {
            errors.push('Yearly spending must be greater than 0');
        }
        
        if (inputs.effectiveTaxRate < 0 || inputs.effectiveTaxRate > 0.5) {
            errors.push('Tax rate should be between 0% and 50%');
        }
        
        const totalStarting = inputs.startingTaxDeferred + inputs.startingRoth + inputs.startingTaxable;
        if (totalStarting <= 0) {
            errors.push('Total starting balance must be greater than 0');
        }
        
        if (inputs.projectionYears < 1 || inputs.projectionYears > 50) {
            errors.push('Projection years should be between 1 and 50');
        }
        
        return errors;
    }

    calculateProjection() {
        console.log('calculateProjection called');
        const inputs = this.getInputValues();
        console.log('Inputs:', inputs);
        
        const errors = this.validateInputs(inputs);
        if (errors.length > 0) {
            console.warn('Validation errors:', errors);
            return;
        }

        console.log('Running projection...');
        this.projectionData = this.runProjection(inputs);
        console.log('Projection data:', this.projectionData);
        
        if (this.projectionData && this.projectionData.length > 0) {
            console.log('Updating UI with projection data');
            this.updateUI(inputs, this.projectionData);
        } else {
            console.error('No projection data to display');
        }
    }

    runProjection(inputs) {
        const data = [];
        const currentYear = new Date().getFullYear();
        
        // Initialize balances
        let taxDeferredBalance = inputs.startingTaxDeferred;
        let rothBalance = inputs.startingRoth;
        let taxableBalance = inputs.startingTaxable;
        let currentSpending = inputs.yearlySpend;
        
        for (let year = 0; year < inputs.projectionYears; year++) {
            const projectionYear = currentYear + year;
            
            // Calculate inflation-adjusted spending
            if (year > 0) {
                currentSpending *= (1 + inputs.inflationRate);
            }
            
            // Add the additional spend only in the first year (year 0)
            const totalSpendingThisYear = year === 0 ? currentSpending + inputs.addedSpend : currentSpending;
            
            // Calculate total balance before withdrawal
            const totalBalance = taxDeferredBalance + rothBalance + taxableBalance;
            
            if (totalBalance <= 0) {
                // Funds depleted
                data.push({
                    year: projectionYear,
                    withdrawal: 0,
                    taxes: 0,
                    netSpending: 0,
                    taxDeferredBalance: 0,
                    rothBalance: 0,
                    taxableBalance: 0,
                    totalBalance: 0,
                    percentWithdrawn: 0,
                    monthlyNet: 0
                });
                continue;
            }
            
            // Withdrawal strategy: Tax-deferred first, then Roth, then Taxable
            // The withdrawal amount is the net amount after taxes
            let remainingNeeded = totalSpendingThisYear;
            let totalWithdrawal = 0;
            let totalTaxes = 0;
            
            // Calculate total available balance for withdrawal
            const totalAvailable = taxDeferredBalance + rothBalance + taxableBalance;
            
            // If we have enough funds, proceed with withdrawal
            if (totalAvailable >= remainingNeeded) {
                // Withdraw from tax-deferred first
                if (taxDeferredBalance > 0) {
                    const withdrawal = Math.min(remainingNeeded, taxDeferredBalance);
                    const taxes = withdrawal * inputs.effectiveTaxRate;
                    const netAmount = withdrawal - taxes;
                    
                    taxDeferredBalance -= withdrawal;
                    totalWithdrawal += withdrawal;
                    totalTaxes += taxes;
                    remainingNeeded = 0;
                }
                
                // If we still need money after tax-deferred, use Roth (tax-free)
                if (remainingNeeded > 0 && rothBalance > 0) {
                    const withdrawal = Math.min(remainingNeeded, rothBalance);
                    rothBalance -= withdrawal;
                    totalWithdrawal += withdrawal;
                    remainingNeeded -= withdrawal;
                }
                
                // If we still need money, use taxable account (assume some tax efficiency)
                if (remainingNeeded > 0 && taxableBalance > 0) {
                    const withdrawal = Math.min(remainingNeeded, taxableBalance);
                    const taxes = withdrawal * 0.15;  // 15% tax on taxable account withdrawals
                    const netAmount = withdrawal - taxes;
                    
                    taxableBalance -= withdrawal;
                    totalWithdrawal += withdrawal;
                    totalTaxes += taxes;
                    remainingNeeded = 0;
                }
            }
            
            const netSpending = totalWithdrawal - totalTaxes; // Net spending after taxes
            const percentWithdrawn = totalBalance > 0 ? (totalWithdrawal / totalBalance) * 100 : 0;
            
            // Apply investment growth to remaining balances
            taxDeferredBalance *= (1 + inputs.rateOfReturn);
            rothBalance *= (1 + inputs.rateOfReturn);
            taxableBalance *= (1 + inputs.rateOfReturn);
            
            data.push({
                year: projectionYear,
                withdrawal: totalWithdrawal,
                taxes: totalTaxes,
                netSpending: netSpending,
                taxDeferredBalance: taxDeferredBalance,
                rothBalance: rothBalance,
                taxableBalance: taxableBalance,
                totalBalance: taxDeferredBalance + rothBalance + taxableBalance,
                percentWithdrawn: percentWithdrawn,
                monthlyNet: netSpending / 12
            });
        }
        
        return data;
    }

    updateUI(inputs, data) {
        this.updateSummaryCards(inputs, data);
        this.updateTable(data);
        this.updateCharts(data);
    }

    updateSummaryCards(inputs, data) {
        const totalStarting = inputs.startingTaxDeferred + inputs.startingRoth + inputs.startingTaxable;
        const finalBalance = data.length > 0 ? data[data.length - 1].totalBalance : 0;
        const totalTaxes = data.reduce((sum, row) => sum + row.taxes, 0);
        const avgWithdrawal = data.length > 0 ? 
            data.reduce((sum, row) => sum + row.percentWithdrawn, 0) / data.length : 0;
        
        document.getElementById('total-starting').textContent = this.formatCurrency(totalStarting);
        document.getElementById('final-balance').textContent = this.formatCurrency(finalBalance);
        document.getElementById('total-taxes').textContent = this.formatCurrency(totalTaxes);
        document.getElementById('avg-withdrawal').textContent = avgWithdrawal.toFixed(1) + '%';
        document.getElementById('final-year').textContent = inputs.projectionYears;
        
        // Color coding for final balance
        const finalBalanceEl = document.getElementById('final-balance');
        finalBalanceEl.className = 'card-value';
        if (finalBalance > totalStarting * 0.5) {
            finalBalanceEl.classList.add('text-success');
        } else if (finalBalance > 0) {
            finalBalanceEl.classList.add('text-warning');
        } else {
            finalBalanceEl.classList.add('text-danger');
        }
    }

    updateTable(data) {
        const tbody = document.getElementById('projection-tbody');
        tbody.innerHTML = '';
        
        data.forEach(row => {
            const tr = document.createElement('tr');
            
            // Add color coding for low balances
            if (row.totalBalance < row.withdrawal * 5) {
                tr.classList.add('bg-warning');
            } else if (row.totalBalance <= 0) {
                tr.classList.add('bg-danger');
            }
            
            tr.innerHTML = `
                <td>${row.year}</td>
                <td>${this.formatCurrency(row.withdrawal)}</td>
                <td>${this.formatCurrency(row.taxes)}</td>
                <td>${this.formatCurrency(row.netSpending)}</td>
                <td>${this.formatCurrency(row.totalBalance)}</td>
                <td>${row.percentWithdrawn.toFixed(2)}%</td>
                <td>${this.formatCurrency(row.monthlyNet)}</td>
            `;
            
            tbody.appendChild(tr);
        });
    }

    updateCharts(data) {
        // Update both charts
        this.updateBalanceChart(data);
        this.updateSpendingChart(data);
    }

    updateBalanceChart(data) {
        const ctx = document.getElementById('balance-chart').getContext('2d');
        
        // Prepare chart data
        const chartData = {
            labels: data.map(row => row.year.toString()),
            datasets: [{
                label: 'Total Balance',
                data: data.map(row => row.totalBalance),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        };

        // Chart options
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 800,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.raw || 0;
                            return this.formatCurrency(value);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => {
                            if (value >= 1000000) {
                                return `$${(value / 1000000).toFixed(1)}M`;
                            } else if (value >= 1000) {
                                return `$${(value / 1000).toFixed(0)}K`;
                            }
                            return `$${value}`;
                        }
                    }
                }
            },
            elements: {
                point: {
                    radius: 0,
                    hoverRadius: 6
                }
            }
        };

        // Destroy existing chart if it exists
        if (this.balanceChart) {
            this.balanceChart.destroy();
        }
        
        // Create new chart instance
        this.balanceChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: options
        });
    }

    updateSpendingChart(data) {
        const ctx = document.getElementById('spending-chart').getContext('2d');
        
        // Calculate totals
        const totalSpending = data.reduce((sum, row) => sum + row.netSpending, 0);
        const totalTaxes = data.reduce((sum, row) => sum + row.taxes, 0);
        
        // Prepare chart data
        const chartData = {
            labels: ['Net Spending', 'Taxes Paid'],
            datasets: [{
                data: [totalSpending, totalTaxes],
                backgroundColor: ['#667eea', '#764ba2'],
                borderWidth: 0
            }]
        };

        // Chart options
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 800,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${this.formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            elements: {
                arc: {
                    radius: '70%',
                    hoverRadius: '75%'
                }
            }
        };

        // Destroy existing chart if it exists
        if (this.spendingChart) {
            this.spendingChart.destroy();
        }
        
        // Create new chart instance
        this.spendingChart = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: options
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Store the calculator instance globally
    window.retirementCalculator = new RetirementCalculator();
    
    // Manually trigger the initial calculation after a short delay
    // to ensure all elements are fully rendered
    setTimeout(() => {
        window.retirementCalculator.calculateProjection();
    }, 100);
});
