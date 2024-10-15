


$(document).ready(function() {
    function fetchPortfolioData() {
        $.ajax({
            url: '/api/portfolio', // Your Flask API endpoint
            type: 'GET',
            success: function(data) {
                // Update the DOM with the fetched data
                $('#total-investment').text('₹' + data.total_investment);
                $('#current-portfolio-value').text('₹' + data.current_portfolio_value);
                $('#profit-loss').text('₹' + (data.profit_loss >= 0 ? '+' : '') + data.profit_loss);
                $('#available-cash').text('₹' + data.available_cash);
            },
            error: function(error) {
                console.error('Error fetching portfolio data:', error);
            }
        });
    }

    // Fetch portfolio data initially
    fetchPortfolioData();

    // Optionally, set an interval to refresh the data every minute
    setInterval(fetchPortfolioData, 60000);


    
});


$(document).ready(function() {
    function fetchStockData() {
        // const username = "{{ username }}";  // Pass the username from the Flask context
        $.ajax({
            url: '/api/stocks', // Include username in the request
            type: 'GET',
            success: function(data) {
                const tbody = $('#stock-breakdown-body');
                tbody.empty(); // Clear existing rows

                data.forEach(stock => {
                    const profitLossClass = stock.profit_loss >= 0 ? 'profit' : 'loss';
                    tbody.append(`
                        <tr data-symbol="${stock.symbol}">
                            <td>${stock.symbol}</td>
                            <td>${stock.shares}</td>
                            <td>${stock.purchase_price.toFixed(2)}</td>
                            <td class="current-price">${stock.current_price.toFixed(2)}</td>
                            <td class="${profitLossClass}">${stock.profit_loss.toFixed(2)}%</td>
                        </tr>
                    `);
                });
            },
            error: function(error) {
                console.error('Error fetching stock data:', error);
            }
        });
    }

    // Fetch stock data initially
    fetchStockData();

    // Optionally, set an interval to refresh the data every minute
    setInterval(fetchStockData, 60000);
});


$(document).ready(function() {
    function fetchTransactions() {
        // const username = "{{ username }}";  // Get the username from Flask context
        $.ajax({
            url: '/api/transactions_dashboard', // Include username in the request
            type: 'GET',
            success: function(data) {
                const tbody = $('.recent-transactions-table tbody');
                tbody.empty(); // Clear existing rows

                data.forEach(transaction => {
                    tbody.append(`
                        <tr>
                            <td>${transaction.symbol}</td>
                            <td data-type="${transaction.type}">${transaction.type}</td>
                            <td>${transaction.shares}</td>
                            <td>${transaction.price_per_share.toFixed(2)}</td>
                            <td>${transaction.total_value.toFixed(2)}</td>
                            <td>${transaction.date}</td>
                        </tr>
                    `);
                });
            },
            error: function(error) {
                console.error('Error fetching transactions:', error);
            }
        });
    }

    // Fetch transactions initially
    fetchTransactions();

    // Set an interval to refresh the data every minute (60000 ms)
    setInterval(fetchTransactions, 60000);
});


$(document).ready(function() {
    function fetchPortfolioData() {
        // const username = "{{ username }}";  // Get the username from Flask context
        $.ajax({
            url: '/api/portfolio',
            type: 'GET',
            success: function(data) {
                // Update the portfolio composition chart
                updatePortfolioChart(data);
            },
            error: function(error) {
                console.error('Error fetching portfolio data:', error);
            }
        });
    }

    function fetchStockPrices() {
        $.ajax({
            url: '/api/stock-prices',
            type: 'GET',
            success: function(data) {
                // Update stock prices chart
                updateStockPricesChart(data);
            },
            error: function(error) {
                console.error('Error fetching stock prices:', error);
            }
        });
    }

    function updatePortfolioChart(data) {
        const portfolioComposition = [{
            labels: ['Total Investment', 'Current Value', 'Profit/Loss'],
            values: [data.total_investment, data.current_value, data.profit_loss],
            type: 'pie'
        }];

        const layout = {
            title: 'Portfolio Composition',
        };

        Plotly.newPlot('portfolio-composition-chart', portfolioComposition, layout);
    }

    function updateStockPricesChart(data) {
        const trace = {
            x: Object.keys(data),
            y: Object.values(data),
            type: 'bar'
        };

        const layout = {
            title: 'Stock Prices',
            xaxis: {
                title: 'Stock Symbol'
            },
            yaxis: {
                title: 'Price'
            }
        };

        Plotly.newPlot('stock-graph', [trace], layout);
    }

    // Fetch initial data
    fetchPortfolioData();
    fetchStockPrices();

    // Set an interval to refresh the data every minute
    setInterval(() => {
        fetchPortfolioData();
        fetchStockPrices();
    }, 60000);
});
