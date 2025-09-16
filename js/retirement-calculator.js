class RetirementCalculator {
    constructor() {
        this.projectionData = [];
        this.isCalculating = false;
        this.currentYear = new Date().getFullYear();
        this.initializeEventListeners();
        this.setupFormValidation();
    }

    // Format currency input
    formatCurrencyInput(e) {
        let value = e.target.value.replace(/[^\d]/g, '');
        value = value ? parseInt(value, 10).toLocaleString() : '';
        e.target.value = value;
        return value.replace(/[^\d]/g, '');
    }

    // Add currency formatting to input
    addCurrencyFormatting(input) {
        input.addEventListener('focus', (e) => {
            let value = e.target.value.replace(/[^\d]/g, '');
            e.target.value = value;
        });

        input.addEventListener('blur', (e) => {
            let value = e.target.value.replace(/[^\d]/g, '');
            value = value ? parseInt(value, 10).toLocaleString() : '';
            e.target.value = value;
        });
    }

    // Debounce function to limit how often a function can run
    debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // Validate form input
    validateInput(input) {
        const value = input.value.trim();
        const validationRules = input.dataset.validate ? input.dataset.validate.split(',') : [];
        const group = input.closest('.input-group');
        const messageEl = group ? group.querySelector('.validation-message') : null;
        
        // Clear previous states
        if (group) group.classList.remove('has-error', 'has-success');
        if (messageEl) messageEl.textContent = '';
        
        // Skip validation for empty optional fields
        if (value === '' && !validationRules.includes('required')) {
            return true;
        }
        
        let isValid = true;
        let errorMessage = '';
        
        // Check each validation rule
        for (const rule of validationRules) {
            const [ruleName, ruleValue] = rule.split(':');
            
            switch (ruleName) {
                case 'required':
                    if (value === '') {
                        errorMessage = 'This field is required';
                        isValid = false;
                    }
                    break;
                    
                case 'number':
                    if (isNaN(parseFloat(value))) {
                        errorMessage = 'Please enter a valid number';
                        isValid = false;
                    }
                    break;
                    
                case 'min':
                    if (parseFloat(value) < parseFloat(ruleValue)) {
                        errorMessage = `Value must be at least ${ruleValue}`;
                        isValid = false;
                    }
                    break;
                    
                case 'max':
                    if (parseFloat(value) > parseFloat(ruleValue)) {
                        errorMessage = `Value must be no more than ${ruleValue}`;
                        isValid = false;
                    }
                    break;
                    
                case 'currency':
                    const numValue = value.replace(/[^\d.]/g, '');
                    if (isNaN(parseFloat(numValue))) {
                        errorMessage = 'Please enter a valid amount';
                        isValid = false;
                    }
                    break;
            }
            
            if (!isValid) break;
        }
        
        // Update UI based on validation
        if (group) {
            if (value && isValid) {
                group.classList.add('has-success');
            } else if (!isValid) {
                group.classList.add('has-error');
                if (messageEl) {
                    messageEl.textContent = errorMessage;
                }
            }
        }
        
        return isValid;
    }

    // Validate all form inputs
    validateAllInputs() {
        const form = document.getElementById('projection-form');
        if (!form) return true;
        
        let isValid = true;
        const inputs = form.querySelectorAll('input[data-validate]');
        
        inputs.forEach(input => {
            if (!this.validateInput(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    // Check if form is valid
    isFormValid() {
        return this.validateAllInputs();
    }

    // Parse currency input to number
    parseCurrency(value) {
        if (typeof value === 'string') {
            return parseFloat(value.replace(/[^\d.]/g, '')) || 0;
        }
        return value || 0;
    }

    // Calculate inflation-adjusted amount
    adjustForInflation(amount, years, inflationRate) {
        return amount * Math.pow(1 + (inflationRate / 100), years);
    }

    // Calculate tax on withdrawal
    calculateTax(amount, taxRate) {
        return amount * (taxRate / 100);
    }

    // Calculate annual projection
    calculateAnnualProjection(year, params) {
        const {
            startingBalance,
            rateOfReturn,
            inflationRate,
            yearlySpend,
            taxRate,
            socialSecurity = 0,
            pension = 0,
            otherIncome = 0,
            currentAge
        } = params;

        // Calculate beginning of year values
        const beginningBalance = year === 0 ? startingBalance : this.projectionData[year - 1].endingBalance;
        
        // Calculate withdrawals (inflation-adjusted)
        const inflationAdjustedSpend = this.adjustForInflation(yearlySpend, year, inflationRate);
        
        // Calculate income (inflation-adjusted)
        const inflationAdjustedSS = this.adjustForInflation(socialSecurity, year, inflationRate);
        const inflationAdjustedPension = this.adjustForInflation(pension, year, inflationRate);
        const inflationAdjustedOtherIncome = this.adjustForInflation(otherIncome, year, inflationRate);
        
        // Calculate total income and taxable income
        const totalIncome = inflationAdjustedSS + inflationAdjustedPension + inflationAdjustedOtherIncome;
        
        // Calculate withdrawal needed (after accounting for income)
        let withdrawalNeeded = Math.max(0, inflationAdjustedSpend - totalIncome);
        
        // Calculate taxes on withdrawal (assuming all withdrawals are from tax-deferred accounts for simplicity)
        const taxes = this.calculateTax(withdrawalNeeded, taxRate);
        const totalWithdrawal = withdrawalNeeded + taxes;
        
        // Calculate growth on the balance before withdrawal
        const growth = beginningBalance * (rateOfReturn / 100);
        
        // Calculate ending balance
        const endingBalance = beginningBalance + growth - totalWithdrawal;
        
        // Debug log for first year
        if (year === 0) {
            console.log('First year projection:', {
                beginningBalance,
                inflationAdjustedSpend,
                totalIncome,
                withdrawalNeeded,
                taxes,
                totalWithdrawal,
                growth,
                endingBalance
            });
        }
        
        return {
            year: this.currentYear + year,
            age: params.currentAge + year,
            beginningBalance,
            withdrawal: totalWithdrawal,
            taxes,
            growth,
            endingBalance,
            socialSecurity: inflationAdjustedSS,
            pension: inflationAdjustedPension,
            otherIncome: inflationAdjustedOtherIncome,
            taxes,
            inflationAdjustedSpend
        };
    }

    // Calculate full projection
    calculateProjection() {
        if (this.isCalculating) return;
        this.isCalculating = true;
        
        try {
            // Get form values
            const rateOfReturn = parseFloat(document.getElementById('rate-of-return').value) || 6.0;
            const inflationRate = parseFloat(document.getElementById('inflation-rate').value) || 3.0;
            const yearlySpend = this.parseCurrency(document.getElementById('yearly-spend').value) || 0;
            const taxRate = parseFloat(document.getElementById('effective-tax-rate').value) || 15.0;
            const years = parseInt(document.getElementById('projection-years').value) || 30;
            const currentAge = parseInt(document.getElementById('current-age')?.value) || 65;
            
            // Get all account balances
            const taxDeferredInput = document.getElementById('starting-tax-deferred');
            const rothInput = document.getElementById('starting-roth');
            const taxableInput = document.getElementById('starting-taxable');
            
            console.log('Input elements:', { taxDeferredInput, rothInput, taxableInput });
            
            const startingTaxDeferred = this.parseCurrency(taxDeferredInput?.value) || 0;
            const startingRoth = this.parseCurrency(rothInput?.value) || 0;
            const startingTaxable = this.parseCurrency(taxableInput?.value) || 0;
            
            // Get income sources
            const socialSecurity = this.parseCurrency(document.getElementById('annual-social-security')?.value) || 0;
            const pension = this.parseCurrency(document.getElementById('annual-pension')?.value) || 0;
            const otherIncome = this.parseCurrency(document.getElementById('other-income')?.value) || 0;
            
            // Calculate starting balance (sum of all accounts)
            const startingBalance = startingTaxDeferred + startingRoth + startingTaxable;
            
            // Debug log to verify values
            console.log('Starting balances:', { 
                taxDeferred: startingTaxDeferred, 
                roth: startingRoth, 
                taxable: startingTaxable, 
                total: startingBalance 
            });
            
            // Calculate projection for each year
            this.projectionData = [];
            let currentBalance = startingBalance;
            
            for (let year = 0; year < years; year++) {
                const projection = this.calculateAnnualProjection(year, {
                    startingBalance: currentBalance,
                    rateOfReturn,
                    inflationRate,
                    yearlySpend,
                    taxRate,
                    socialSecurity: year >= 0 ? socialSecurity : 0, // Adjust for when SS starts
                    pension,
                    otherIncome,
                    currentAge
                });
                
                this.projectionData.push(projection);
                currentBalance = projection.endingBalance;
                
                // Stop if we run out of money
                if (currentBalance <= 0) break;
            }
            
            return this.projectionData;
            
        } catch (error) {
            console.error('Error calculating projection:', error);
            return [];
        } finally {
            this.isCalculating = false;
        }
    }

    // Update the UI with projection results
    updateResults() {
        try {
            // Show loading state
            const runButton = document.getElementById('run-projection');
            if (runButton) {
                const originalText = runButton.innerHTML;
                runButton.disabled = true;
                runButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
                
                // Use setTimeout to ensure UI updates before heavy calculation
                setTimeout(() => {
                    try {
                        const results = this.calculateProjection();
                        if (!results || results.length === 0) return;
                        
                        // Update all UI components
                        this.updateSummaryCards(results);
                        this.updateProjectionChart(results);
                        this.updateResultsTable(results);
                    } catch (error) {
                        console.error('Error updating results:', error);
                    } finally {
                        // Restore button state
                        runButton.disabled = false;
                        runButton.innerHTML = originalText;
                    }
                }, 50);
            } else {
                // Fallback if button not found
                const results = this.calculateProjection();
                if (!results || results.length === 0) return;
                
                this.updateSummaryCards(results);
                this.updateProjectionChart(results);
                this.updateResultsTable(results);
            }
        } catch (error) {
            console.error('Error in updateResults:', error);
        }
    }

    // Update summary cards with key metrics
    updateSummaryCards(results) {
        if (!results.length) return;
        
        const lastYear = results[results.length - 1];
        const firstYear = results[0];
        
        // Update ending balance
        const endingBalanceEl = document.getElementById('ending-balance');
        if (endingBalanceEl) {
            endingBalanceEl.textContent = `$${Math.round(lastYear.endingBalance).toLocaleString()}`;
        }
        
        // Update total withdrawals
        const totalWithdrawals = results.reduce((sum, year) => sum + year.withdrawal, 0);
        const totalWithdrawalsEl = document.getElementById('total-withdrawals');
        if (totalWithdrawalsEl) {
            totalWithdrawalsEl.textContent = `$${Math.round(totalWithdrawals).toLocaleString()}`;
        }
        
        // Update average return
        const avgReturnEl = document.getElementById('avg-annual-return');
        if (avgReturnEl) {
            const avgReturn = results.reduce((sum, year) => {
                return sum + (year.growth / (year.beginningBalance || 1));
            }, 0) / results.length * 100;
            
            avgReturnEl.textContent = `${avgReturn.toFixed(1)}%`;
            
            // Color code based on return
            avgReturnEl.className = '';
            if (avgReturn > 7) avgReturnEl.classList.add('positive');
            else if (avgReturn < 5) avgReturnEl.classList.add('negative');
            else avgReturnEl.classList.add('neutral');
        }
    }

    // Update the projection chart
    updateProjectionChart(results) {
        const ctx = document.getElementById('projection-chart');
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (this.projectionChart) {
            this.projectionChart.destroy();
        }
        
        // Prepare data for chart
        const labels = results.map(r => r.year);
        const balances = results.map(r => r.endingBalance);
        const withdrawals = results.map(r => r.withdrawal);
        
        // Create new chart
        this.projectionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Portfolio Value',
                        data: balances,
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Annual Withdrawal',
                        data: withdrawals,
                        borderColor: '#F44336',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                        maximumFractionDigits: 0
                                    }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Retirement Projection Over Time'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    maximumFractionDigits: 0,
                                    notation: 'compact',
                                    compactDisplay: 'short'
                                }).format(value);
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Year'
                        }
                    }
                }
            }
        });
    }

    // Update the results table
    updateResultsTable(results) {
        const tbody = document.getElementById('projection-table-body');
        if (!tbody) return;
        
        // Clear existing rows
        tbody.innerHTML = '';
        
        // Add rows for each year
        results.forEach(yearData => {
            const row = document.createElement('tr');
            
            // Format currency values
            const formatCurrency = (value) => {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0
                }).format(value);
            };
            
            // Add cells to the row
            row.innerHTML = `
                <td>${yearData.year}</td>
                <td>${yearData.age}</td>
                <td>${formatCurrency(yearData.beginningBalance)}</td>
                <td>${formatCurrency(yearData.withdrawal)}</td>
                <td>${formatCurrency(yearData.endingBalance)}</td>
                <td>${formatCurrency(yearData.taxes)}</td>
            `;
            
            // Highlight negative balance in red
            if (yearData.endingBalance < 0) {
                row.classList.add('negative-balance');
            }
            
            tbody.appendChild(row);
        });
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Set up input event listeners for auto-update with debounce
        const debouncedUpdate = this.debounce(() => {
            if (this.isFormValid()) {
                this.updateResults();
            }
        }, 500);
        
        // Add event listeners to all inputs
        const form = document.getElementById('projection-form');
        const runButton = document.getElementById('run-projection');
        
        // Add click handler for the Update Projection button
        if (runButton) {
            runButton.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.isFormValid()) {
                    this.updateResults();
                }
            });
        }
        
        if (form) {
            const inputs = form.querySelectorAll('input, select');
            
            inputs.forEach(input => {
                // Add currency formatting for currency inputs
                if (input.type === 'text' && input.pattern === '[0-9,.]*') {
                    this.addCurrencyFormatting(input);
                    
                    // Update on blur with validation
                    input.addEventListener('blur', (e) => {
                        if (this.validateInput(input)) {
                            debouncedUpdate();
                        }
                    });
                    
                    // Update on input with debounce (for better UX)
                    let inputTimer;
                    input.addEventListener('input', (e) => {
                        this.formatCurrencyInput(e);
                        
                        // Clear any existing timer
                        if (inputTimer) {
                            clearTimeout(inputTimer);
                        }
                        
                        // Set a new timer to update after user stops typing
                        inputTimer = setTimeout(() => {
                            if (this.validateInput(input)) {
                                debouncedUpdate();
                            }
                        }, 1000);
                    });
                } else {
                    // For other inputs (select, number), update on change and blur
                    const updateHandler = () => {
                        if (this.validateInput(input)) {
                            debouncedUpdate();
                        }
                    };
                    
                    input.addEventListener('change', updateHandler);
                    input.addEventListener('blur', updateHandler);
                    
                    // For number inputs, also update on arrow clicks
                    if (input.type === 'number') {
                        input.addEventListener('input', updateHandler);
                    }
                }
            });
        }
        
        // Initial validation and calculation
        if (this.isFormValid()) {
            this.updateResults();
        }
    }
    
    // Set up form validation
    setupFormValidation() {
        // Add required field indicators
        document.querySelectorAll('[data-validate*="required"]').forEach(input => {
            const label = input.closest('.input-group')?.querySelector('label');
            if (label && !label.querySelector('.required')) {
                const requiredSpan = document.createElement('span');
                requiredSpan.className = 'required';
                requiredSpan.textContent = ' *';
                label.appendChild(requiredSpan);
            }
        });
    }
}

// Initialize the calculator when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the projections page
    if (document.querySelector('.projections')) {
        window.retirementCalculator = new RetirementCalculator();
    }
});
