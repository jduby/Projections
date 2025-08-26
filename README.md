# 🏦 Retirement Drawdown Projection App

A comprehensive web application for modeling retirement account withdrawals over time, helping you plan your retirement with confidence.

## 🌟 Features

- **Real-time Calculations**: Instant updates as you modify input parameters
- **Multiple Account Types**: Support for tax-deferred, Roth, and taxable accounts
- **Smart Withdrawal Strategy**: Optimized withdrawal order to minimize taxes
- **Interactive Visualizations**: 
  - Line chart showing account balance over time
  - Pie chart displaying spending vs. taxes breakdown
- **Detailed Projections**: Year-by-year breakdown with key metrics
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Input Validation**: Ensures all parameters are within reasonable ranges

## 🚀 Getting Started

### Quick Start
1. Open `index.html` in your web browser
2. Adjust the input parameters in the left panel
3. View real-time projections in the results panel

### Input Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| **Annual Rate of Return** | Expected annual investment return (%) | 5.5% |
| **Annual Inflation Rate** | Expected annual inflation rate (%) | 3.0% |
| **Initial Yearly Spending** | Annual spending in today's dollars | $40,000 |
| **Effective Tax Rate** | Tax rate on withdrawals (%) | 13.0% |
| **Starting Tax-Deferred Balance** | 401(k), Traditional IRA, etc. | $1,000,000 |
| **Starting Roth Balance** | Roth IRA, Roth 401(k) | $0 |
| **Starting Taxable Balance** | Brokerage accounts | $0 |
| **Projection Years** | Number of years to project | 30 |

## 📊 How It Works

### Withdrawal Strategy
The app uses an optimized withdrawal strategy to minimize taxes:

1. **Tax-Deferred Accounts First**: Withdraws from 401(k)/Traditional IRA first (subject to taxes)
2. **Roth Accounts Second**: Tax-free withdrawals from Roth accounts
3. **Taxable Accounts Last**: Withdrawals from brokerage accounts (with capital gains considerations)

### Key Calculations
- **Inflation Adjustment**: Spending increases annually based on inflation rate
- **Investment Growth**: Remaining balances grow at the specified rate of return
- **Tax Calculations**: Accurate tax computations on withdrawals
- **Percentage Withdrawn**: Shows what percentage of total balance is withdrawn each year

### Visual Insights
- **Balance Chart**: Track how your total account balance changes over time
- **Spending Chart**: See the breakdown between net spending and taxes paid
- **Summary Cards**: Key metrics at a glance
- **Detailed Table**: Year-by-year breakdown with all calculations

## 🎯 Use Cases

- **Retirement Planning**: Determine if your savings will last through retirement
- **Tax Strategy**: Optimize withdrawal strategies to minimize tax burden
- **Scenario Analysis**: Test different rates of return, inflation, and spending levels
- **Financial Education**: Understand the impact of various factors on retirement sustainability

## 🔧 Technical Details

### Built With
- **HTML5**: Semantic markup and accessibility
- **CSS3**: Modern styling with gradients, animations, and responsive design
- **Vanilla JavaScript**: No frameworks - fast and lightweight
- **Chart.js**: Beautiful, responsive charts and graphs

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### File Structure
```
retirement_drawdown_app/
├── index.html          # Main application page
├── styles.css          # Styling and responsive design
├── script.js           # Core calculation logic and UI interactions
├── README.md           # This documentation
├── inputs.csv          # Original input parameters reference
├── projection_template.csv  # Original projection reference
└── Template_Projection copy.xlsx  # Original Excel model
```

## 📈 Example Scenarios

### Conservative Scenario
- Rate of Return: 4%
- Inflation: 2%
- Starting Balance: $800,000
- Annual Spending: $35,000

### Moderate Scenario (Default)
- Rate of Return: 5.5%
- Inflation: 3%
- Starting Balance: $1,000,000
- Annual Spending: $40,000

### Aggressive Scenario
- Rate of Return: 7%
- Inflation: 3.5%
- Starting Balance: $1,200,000
- Annual Spending: $50,000

## 🔍 Understanding the Results

### Summary Cards
- **Total Starting Balance**: Sum of all account types
- **Final Balance**: Remaining balance after projection period
- **Total Taxes Paid**: Cumulative taxes over the projection period
- **Average Withdrawal %**: Average percentage of balance withdrawn annually

### Color Coding
- 🟢 **Green**: Healthy balance levels
- 🟡 **Yellow**: Warning - balance getting low (less than 5 years of withdrawals)
- 🔴 **Red**: Critical - funds depleted

## 💡 Tips for Use

1. **Start Conservative**: Use lower rates of return for more conservative planning
2. **Consider Inflation**: Don't forget to account for inflation in your spending
3. **Test Scenarios**: Try different combinations to see various outcomes
4. **Regular Updates**: Revisit and update your projections annually
5. **Professional Advice**: Use this as a planning tool, but consult with financial advisors for major decisions

## 🚨 Important Disclaimers

- This tool is for educational and planning purposes only
- Results are projections based on assumptions and may not reflect actual outcomes
- Past performance does not guarantee future results
- Consult with qualified financial professionals for personalized advice
- Tax calculations are simplified and may not reflect your actual tax situation

## 📞 Support

For questions or suggestions about this retirement planning tool, please refer to the original project documentation or consult with a financial planning professional.

---

**Built with ❤️ for better retirement planning**
