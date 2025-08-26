// Retirement Drawdown Projection Calculator
class RetirementCalculator {
    constructor() {
        this.projectionData = [];
        this.isCalculating = false;
        this.initializeEventListeners();
        this.setupFormValidation();
    }

    initializeEventListeners() {
        const form = document.getElementById('projection-form');
        const inputs = form.querySelectorAll('input');
        
        // Set up input event listeners for auto-update with debounce
        const debouncedUpdate = this.debounce(() => {
            if (this.isFormValid()) {
                this.calculateAndUpdate();
            }
        }, 500);
        
        inputs.forEach(input => {
            // Add currency formatting for currency inputs
            if (input.type === 'text' && input.pattern) {
                this.addCurrencyFormatting(input);
                
                // Update on blur and input with debounce
                input.addEventListener('blur', () => {
                    this.validateInput(input);
                    debouncedUpdate();
                });
                
                // Add input masking and trigger update on change
                input.addEventListener('input', (e) => {
                    this.formatCurrencyInput(e);
                    debouncedUpdate();
                });
            } else {
                // For number inputs, update on change and input
                const updateHandler = () => {
                    this.validateInput(input);
                    debouncedUpdate();
                };
                
                input.addEventListener('change', updateHandler);
                input.addEventListener('input', updateHandler);
            }
        });
        
        // Initial validation
        this.validateAllInputs();
    }
    
    setupFormValidation() {
        // Add required field indicators
        document.querySelectorAll('[data-validate*="required"]').forEach(input => {
            const label = input.closest('.input-group').querySelector('label');
            if (label && !label.querySelector('.required')) {
                const requiredSpan = document.createElement('span');
                requiredSpan.className = 'required';
                requiredSpan.textContent = ' *';
                label.appendChild(requiredSpan);
            }
        });
    }

    // Form validation methods
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
                    
                case 'currency':
                    const numValue = this.parseCurrencyInput(value);
                    if (isNaN(numValue) || numValue < 0) {
                        errorMessage = 'Please enter a valid amount';
                        isValid = false;
                    }
                    break;
                    
                case 'min':
                    const min = parseFloat(ruleValue);
                    const numMin = parseFloat(value);
                    if (!isNaN(numMin) && numMin < min) {
                        errorMessage = `Value must be at least ${min}`;
                        isValid = false;
                    }
                    break;
                    
                case 'max':
                    const max = parseFloat(ruleValue);
                    const numMax = parseFloat(value);
                    if (!isNaN(numMax) && numMax > max) {
                        errorMessage = `Value cannot exceed ${max}`;
                        isValid = false;
                    }
                    break;
            }
            
            if (!isValid) break;
        }
        
        // Update UI based on validation
        if (group) {
            if (!isValid) {
                group.classList.add('has-error');
                if (messageEl) messageEl.textContent = errorMessage;
            } else if (value !== '') {
                group.classList.add('has-success');
            }
        }
        
        return isValid;
    }
    
    validateAllInputs() {
        const inputs = document.querySelectorAll('[data-validate]');
        let allValid = true;
        
        inputs.forEach(input => {
            if (!this.validateInput(input)) {
                allValid = false;
            }
        });
        
        return allValid;
    }
    
    isFormValid() {
        return this.validateAllInputs();
    }
    
    // Input formatting methods
    addCurrencyFormatting(input) {
        // Format on blur
        input.addEventListener('blur', (e) => {
            const value = this.parseCurrencyInput(e.target.value);
            if (!isNaN(value)) {
                e.target.value = this.formatCurrency(value);
            }
        });
        
        // Format on input for better UX
        input.addEventListener('input', (e) => {
            this.formatCurrencyInput(e);
        });
    }
    
    formatCurrencyInput(e) {
        // Allow only numbers, comma, and decimal point
        let value = e.target.value.replace(/[^0-9.]/g, '');
        
        // Only allow one decimal point
        const decimalCount = value.split('.').length - 1;
        if (decimalCount > 1) {
            value = value.substring(0, value.length - 1);
        }
        
        // Update the input value
        e.target.value = value;
    }
    
    parseCurrencyInput(value) {
        // Remove all non-numeric characters except decimal point
        const numStr = value.toString().replace(/[^0-9.]/g, '');
        return parseFloat(numStr) || 0;
    }
    
    formatCurrency(value) {
        // Format number with commas and 2 decimal places
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(value);
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
        // Helper function to safely parse float with default value
        const safeParseFloat = (value, defaultValue = 0) => {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? defaultValue : parsed;
        };

        return {
            rateOfReturn: safeParseFloat(document.getElementById('rate-of-return').value, 0) / 100,
            inflationRate: safeParseFloat(document.getElementById('inflation-rate').value, 0) / 100,
            yearlySpend: this.parseCurrencyInput(document.getElementById('yearly-spend').value),
            addedSpend: this.parseCurrencyInput(document.getElementById('added-spend').value) || 0,
            effectiveTaxRate: parseFloat(document.getElementById('effective-tax-rate').value) / 100,
            startingTaxDeferred: this.parseCurrencyInput(document.getElementById('starting-tax-deferred').value),
            startingRoth: this.parseCurrencyInput(document.getElementById('starting-roth').value) || 0,
            startingTaxable: this.parseCurrencyInput(document.getElementById('starting-taxable').value) || 0,
            projectionYears: parseInt(document.getElementById('projection-years').value),
            pensionIncome: this.parseCurrencyInput(document.getElementById('pension-income').value) || 0,
            annuityIncome: this.parseCurrencyInput(document.getElementById('annuity-income').value) || 0,
            socialSecurity: this.parseCurrencyInput(document.getElementById('social-security').value) || 0
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

    async calculateAndUpdate() {
        if (this.isCalculating) return;
        
        try {
            this.setLoadingState(true);
            
            // Validate form before calculation
            if (!this.isFormValid()) {
                console.log('Form validation failed');
                return;
            }
            
            const inputs = this.getInputValues();
            console.log('Running projection with inputs:', inputs);
            
            this.projectionData = this.runProjection(inputs);
            console.log('Projection data:', this.projectionData);
            
            if (this.projectionData && this.projectionData.length > 0) {
                this.updateUI(inputs, this.projectionData);
                // Also update charts if they exist
                if (typeof Chart !== 'undefined') {
                    this.updateCharts(this.projectionData);
                }
            } else {
                console.error('No projection data generated');
                this.showError('Failed to generate projection data. Please check your inputs.');
            }
        } catch (error) {
            console.error('Error in calculateAndUpdate:', error);
            this.showError('An error occurred while calculating. Please check the console for details.');
        } finally {
            this.setLoadingState(false);
        }
    }
    
    setLoadingState(isLoading) {
        this.isCalculating = isLoading;
        const form = document.getElementById('projection-form');
        
        if (isLoading) {
            form.classList.add('loading');
        } else {
            form.classList.remove('loading');
        }
    }
    
    showError(message) {
        // Create or update error message element
        let errorEl = document.getElementById('error-message');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.id = 'error-message';
            errorEl.className = 'error-message';
            document.querySelector('.container').insertBefore(errorEl, document.querySelector('.input-container'));
        }
        
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
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
            
            // Calculate total income from all sources
            const totalIncome = inputs.pensionIncome + inputs.annuityIncome + inputs.socialSecurity;
            
            // Calculate net spending after income
            const netSpending = Math.max(0, totalSpendingThisYear - totalIncome);
            
            // Withdrawal strategy: Tax-deferred first, then Roth, then Taxable
            let remainingNeeded = netSpending;
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
            
            // Calculate net spending after taxes and income
            const netSpendingAmount = totalWithdrawal - totalTaxes + totalIncome;
            const percentWithdrawn = totalBalance > 0 ? (totalWithdrawal / totalBalance) * 100 : 0;
            
            // Apply investment growth to remaining balances
            taxDeferredBalance *= (1 + inputs.rateOfReturn);
            rothBalance *= (1 + inputs.rateOfReturn);
            taxableBalance *= (1 + inputs.rateOfReturn);
            
            data.push({
                year: projectionYear,
                withdrawal: totalWithdrawal,
                taxes: totalTaxes,
                netSpending: netSpendingAmount,
                income: totalIncome,
                taxDeferredBalance: taxDeferredBalance,
                rothBalance: rothBalance,
                taxableBalance: taxableBalance,
                totalBalance: taxDeferredBalance + rothBalance + taxableBalance,
                percentWithdrawn: percentWithdrawn,
                monthlyNet: netSpendingAmount / 12
            });
        }
        
        return data;
    }

    updateUI(inputs, data) {
        try {
            console.log('Updating UI with data:', data);
            this.updateSummaryCards(inputs, data);
            this.updateTable(data);
            
            // Update charts if Chart.js is available
            if (typeof Chart !== 'undefined') {
                this.updateCharts(data);
            } else {
                console.warn('Chart.js not loaded. Charts will not be displayed.');
            }
            
            // Update tax bracket visualization and SS recommendations
            this.updateTaxBracketVisualization(inputs, data);
            this.updateSocialSecurityRecommendation(inputs);
            
            // Make sure results container is visible
            const resultsContainer = document.querySelector('.results-container');
            if (resultsContainer) {
                resultsContainer.style.display = 'block';
            }
        } catch (error) {
            console.error('Error updating UI:', error);
        }
    }
    
    updateTaxBracketVisualization(inputs, data) {
        try {
            // Get the first year's data for the visualization
            const firstYearData = data[0];
            if (!firstYearData) return;
            
            // Calculate taxable income (using gross income for now)
            const taxableIncome = firstYearData.income;
            console.log('Updating tax bracket visualization with income:', taxableIncome);
            
            // Define tax brackets (2025 married filing jointly)
            const brackets = [
                { rate: 10, min: 0, max: 23850 },
                { rate: 12, min: 23851, max: 96950 },
                { rate: 22, min: 96951, max: 206700 },
                { rate: 24, min: 206701, max: 394600 },
                { rate: 32, min: 394601, max: 501050 },
                { rate: 35, min: 501051, max: 751600 },
                { rate: 37, min: 751601, max: Infinity }
            ];
            
            // Update the visualization
            const barsContainer = document.querySelector('.tax-bracket-bars');
            if (!barsContainer) {
                console.error('Could not find tax-bracket-bars container');
                return;
            }
            
            // Clear existing bars but keep the indicator
            barsContainer.innerHTML = '';
            
            // Find which bracket the taxable income falls into
            let currentBracket = brackets[brackets.length - 1]; // Default to highest bracket
            for (const bracket of brackets) {
                if (taxableIncome <= bracket.max) {
                    currentBracket = bracket;
                    break;
                }
            }
            
            // Create bars for each bracket
            const maxDisplayIncome = 751600; // End of 35% bracket (start of 37%)
            const equalWidthPercent = 100 / brackets.length; // Equal width for all brackets
            
            brackets.forEach((bracket, index) => {
                const isCurrentBracket = bracket === currentBracket;
                const barDiv = document.createElement('div');
                barDiv.className = 'tax-bracket-bar' + (isCurrentBracket ? ' current' : '');
                barDiv.setAttribute('data-bracket', bracket.rate);
                
                // Calculate bar height based on bracket max value
                const bracketEnd = bracket.max === Infinity ? maxDisplayIncome : Math.min(bracket.max, maxDisplayIncome);
                const heightPercent = (bracketEnd / maxDisplayIncome) * 100;
                
                // Set equal width for all brackets
                barDiv.style.flex = '1';
                barDiv.style.width = '100%';
                
                // Calculate range text
                const rangeText = bracket.max === Infinity 
                    ? `$${bracket.min.toLocaleString()}+`
                    : `$${bracket.min.toLocaleString()} - $${bracket.max.toLocaleString()}`;
                
                barDiv.innerHTML = `
                    <div class="bracket-label">${bracket.rate}%</div>
                    <div class="bracket-bar" style="height: ${heightPercent}%"></div>
                    <div class="bracket-range">${rangeText}</div>
                `;
                
                barsContainer.appendChild(barDiv);
            });
            
            // Update the indicator for taxable income
            const container = document.querySelector('.tax-bracket-container');
            const indicator = document.querySelector('.taxable-income-indicator');
            
            if (indicator && container) {
                const indicatorLine = indicator.querySelector('.indicator-line');
                const indicatorLabel = indicator.querySelector('.indicator-label');
                
                if (indicatorLine && indicatorLabel) {
                    // Calculate position based on the visual width of each bracket
                    let position = 0;
                    // Use the end of the 37% bracket as the max display income
                    const maxDisplayIncome = 751600; // End of 35% bracket (start of 37%)
                    const displayIncome = Math.min(taxableIncome, maxDisplayIncome);
                    
                    // Calculate the total width of all brackets
                    const totalRange = maxDisplayIncome - brackets[0].min;
                    
                    // Find which bracket the income falls into
                    for (const bracket of brackets) {
                        if (displayIncome <= bracket.max || bracket.max === Infinity) {
                            // Calculate the start and end positions of this bracket
                            const bracketStart = bracket.min;
                            const bracketEnd = bracket.max === Infinity ? maxDisplayIncome : bracket.max;
                            const bracketRange = bracketEnd - bracketStart;
                            
                            // Calculate the income's position within this bracket (0 to 1)
                            const incomeInBracket = Math.min(displayIncome, bracketEnd) - bracketStart;
                            const bracketPosition = Math.max(0, Math.min(1, incomeInBracket / bracketRange));
                            
                            // Calculate the visual position based on the bracket's width
                            const bracketStartPercent = ((bracketStart - brackets[0].min) / totalRange) * 100;
                            const bracketEndPercent = ((bracketEnd - brackets[0].min) / totalRange) * 100;
                            const bracketWidthPercent = bracketEndPercent - bracketStartPercent;
                            
                            // Calculate the final position within the bracket
                            position = bracketStartPercent + (bracketWidthPercent * bracketPosition);
                            break;
                        }
                    }
                    
                    console.log(`Positioning indicator at ${position.toFixed(2)}% for income $${taxableIncome.toLocaleString()}`);
                    
                    // Position the indicator line
                    indicatorLine.style.left = `${Math.min(100, position)}%`;
                    
                    // Update and position the label
                    indicatorLabel.textContent = `$${taxableIncome.toLocaleString()}`;
                    indicatorLabel.style.left = `${Math.min(100, position)}%`;
                    indicatorLabel.style.transform = 'translateX(-50%)';
                    
                    // Make sure the label is visible
                    indicatorLabel.style.display = 'block';
                    indicatorLabel.style.position = 'absolute';
                    indicatorLabel.style.top = '100%';
                    indicatorLabel.style.marginTop = '10px';
                    indicatorLabel.style.backgroundColor = '#1a365d';
                    indicatorLabel.style.color = 'white';
                    indicatorLabel.style.padding = '4px 8px';
                    indicatorLabel.style.borderRadius = '4px';
                    indicatorLabel.style.fontSize = '12px';
                    indicatorLabel.style.whiteSpace = 'nowrap';
                    indicatorLabel.style.zIndex = '10';
                    
                    // Add a small arrow pointer
                    const arrow = document.createElement('div');
                    arrow.style.position = 'absolute';
                    arrow.style.top = '-5px';
                    arrow.style.left = '50%';
                    arrow.style.transform = 'translateX(-50%)';
                    arrow.style.width = 0;
                    arrow.style.height = 0;
                    arrow.style.borderLeft = '5px solid transparent';
                    arrow.style.borderRight = '5px solid transparent';
                    arrow.style.borderBottom = '5px solid #1a365d';
                    
                    indicatorLabel.appendChild(arrow);
                }
            }
        } catch (error) {
            console.error('Error updating tax bracket visualization:', error);
        }
    }

    updateSummaryCards(inputs, data) {
        const totalStarting = inputs.startingTaxDeferred + inputs.startingRoth + inputs.startingTaxable;
        const finalBalance = data[data.length - 1].totalBalance;
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
        // Handle non-numeric values
        if (isNaN(amount)) return '$0';
        
        // Format as currency with no decimal places
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
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
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Store the calculator instance globally
    const calculator = new RetirementCalculator();
    window.retirementCalculator = calculator;
    
    // Run initial calculation with default values
    if (calculator.isFormValid()) {
        calculator.calculateAndUpdate();
    }
});
