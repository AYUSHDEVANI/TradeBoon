// Global variable to hold the watchlist
let watchlist = [];
let selectedTimeframe = '1 day'; // Default timeframe
let selectedChartType = 'line'; // Default chart type
let selectedStockSymbol = 'TATASTEEL'; // This will hold the selected stock symbol
let currentStockPrice = '';  // This will hold the current stock price

// Function to filter stocks based on user input
function filterStocks() {
    const input = document.getElementById('stockSearch').value.toLowerCase();
    const dropdown = document.getElementById('stockDropdown');
    const options = dropdown.options;

    for (let i = 1; i < options.length; i++) {
        const stockName = options[i].text.toLowerCase();
        options[i].style.display = stockName.includes(input) ? 'block' : 'none';
    }
}

// Function to select a stock and update the chart
function selectStock() {
    const dropdown = document.getElementById('stockDropdown');
    const selectedStock = dropdown.value;
    selectedStockSymbol = selectedStock;  // Update the global variable

    if (selectedStock) {
        // Update the chart by setting the URL with the selected stock, timeframe, and chart type
        updateChart(selectedTimeframe, selectedChartType);  // Use the selected timeframe and chart type
        autofillTradeFields(selectedStockSymbol);  // Autofill the Buy/Sell fields
        addStockSymbolForMarketSentiment(selectedStockSymbol);  // Add stock symbol for market sentiment
        fetchStockInfo(selectedStockSymbol);  // Fetch stock info
    }
}

// Function to toggle adding/removing stocks from the watchlist
function toggleWatchlist() {
    const dropdown = document.getElementById('stockDropdown');
    const selectedStock = dropdown.value;

    if (selectedStock && !watchlist.includes(selectedStock)) {
        watchlist.push(selectedStock);
        updateWatchlistDisplay();
        displayMessage(`${selectedStock} added to your watchlist.`, 'favoriteMessage');
        saveWatchlist();  // Save to localStorage
    } else if (watchlist.includes(selectedStock)) {
        watchlist = watchlist.filter(stock => stock !== selectedStock);
        updateWatchlistDisplay();
        displayMessage(`${selectedStock} removed from your watchlist.`, 'favoriteMessage');
        saveWatchlist();  // Save the updated list
    } else {
        displayMessage('Please select a stock to add or remove from your watchlist.', 'favoriteMessage');
    }
}

// Function to update the watchlist display
function updateWatchlistDisplay() {
    const watchlistItems = document.getElementById('watchlistItems');
    watchlistItems.innerHTML = ''; // Clear current items

    watchlist.forEach(stock => {
        const li = document.createElement('li');
        li.textContent = stock;

        // Add a remove button for each stock
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.onclick = () => removeFromWatchlist(stock);
        li.appendChild(removeButton);

        // Add click event to select the stock when clicked
        li.onclick = () => {
            selectFromWatchlist(stock);
        };

        watchlistItems.appendChild(li);
    });
}

// Function to select stock from watchlist and update dropdown and chart
function selectFromWatchlist(stock) {
    const dropdown = document.getElementById('stockDropdown');
    dropdown.value = stock; // Update dropdown selection
    selectStock(); // Update the chart
}

// Function to remove a stock from the watchlist
function removeFromWatchlist(stock) {
    // if (confirm(`Are you sure you want to remove ${stock} from the watchlist?`)) {
        watchlist = watchlist.filter(item => item !== stock);
        updateWatchlistDisplay();
        displayMessage(`${stock} removed from your watchlist.`, 'favoriteMessage');
        saveWatchlist();  // Save the updated watchlist
    // }
}

// Function to set price alerts
function setAlert() {
    const alertPrice = document.getElementById('alertPrice').value;
    const dropdown = document.getElementById('stockDropdown');
    const selectedStock = dropdown.value;

    if (selectedStock && alertPrice) {
        displayMessage(`Alert set for ${selectedStock} at $${alertPrice}.`, 'alertMessage');
    } else {
        displayMessage('Please select a stock and set an alert price.', 'alertMessage');
    }
}

// Function to update technical indicators
function updateIndicators() {
    // Get checkbox states
    const movingAverage = document.getElementById('movingAverage').checked;
    const rsi = document.getElementById('rsi').checked;
    const volume = document.getElementById('volume').checked;

    // Display the selected indicators (you can expand this logic as needed)
    let indicators = [];
    if (movingAverage) indicators.push('Moving Average');
    if (rsi) indicators.push('RSI');
    if (volume) indicators.push('Volume');

    displayMessage(`Selected Indicators: ${indicators.join(', ')}`, 'alertMessage');
}

// Function to update the chart with the selected timeframe and chart type
function updateChart(timeframe, chartType) {
    const dropdown = document.getElementById('stockDropdown');
    const selectedStock = dropdown.value;

    if (selectedStock) {
        const chartFrame = document.getElementById('chartFrame');
        // chartFrame.src = `http://127.0.0.1:8050/?stock=${selectedStock}&timeframe=${timeframe}&chartType=${chartType}`;
        chartFrame.src = `https://tradeboon-production.up.railway.app/?stock=${selectedStock}&timeframe=${timeframe}&chartType=${chartType}`;
    } else {
        alert('Please select a stock first.');
    }
}

// Function to handle chart type selection
function selectChartType() {
    const dropdown = document.getElementById('chartType');
    selectedChartType = dropdown.value;  // Update the global variable
    console.log(selectedChartType);

    // Update the chart with the currently selected timeframe and the new chart type
    updateChart(selectedTimeframe, selectedChartType);
}

// Handle timeframe buttons and ensure the correct value is passed
document.querySelectorAll('.historical-data button').forEach(button => {
    button.addEventListener('click', function () {
        const timeframe = this.textContent.trim().toLowerCase();  // Get the button text as timeframe (e.g., '1d', '5d', etc.)
        selectedTimeframe = timeframe;  // Update the global variable
        updateChart(timeframe, selectedChartType);  // Update the chart with the selected timeframe and chart type
    });
});

document.querySelectorAll('.chart-type button').forEach(button => { // Handle chart type buttons
    button.addEventListener('click', function () {
        const chartType = this.textContent.trim().toLowerCase();  // Get the button text as chart type (e.g., 'candlestick', 'line', etc.)
        selectedChartType = chartType;  // Update the global variable
        updateChart(selectedTimeframe, chartType);  // Update the chart with the selected timeframe and chart type
    });
});

// Function to download the chart (dummy implementation)
function downloadChart() {
    const chartFrame = document.getElementById('chartFrame');
    const chartUrl = chartFrame.src;

    // For simplicity, we will just alert the URL instead of implementing download logic
    alert(`Download the chart from this URL: ${chartUrl}`);
}

// Function to logout
function logout() {
    alert('Logging out...');
    // Here you can redirect to your logout route or perform an action
    // window.location.href = '/logout';
}

// Save watchlist to localStorage
function saveWatchlist() {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

// Load watchlist from localStorage
function loadWatchlist() {
    const savedWatchlist = localStorage.getItem('watchlist');
    if (savedWatchlist) {
        watchlist = JSON.parse(savedWatchlist);
        updateWatchlistDisplay();
    }
}

// Call loadWatchlist on page load to restore the watchlist
window.onload = loadWatchlist;

// Function to display messages
function displayMessage(message, elementId) {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.style.color = 'green'; // Set message color
}






// Function to autofill the Buy/Sell fields with real-time stock price
function autofillTradeFields(stockSymbol) {
    fetch(`/api/get_stock_price?stock_symbol=${stockSymbol}`)
        .then(response => response.json())
        .then(data => {
            if (data.price) {
                currentStockPrice = data.price; // Set the fetched price
                document.getElementById('selectedStock').value = stockSymbol;
                document.getElementById('price').value = currentStockPrice;
            } else {
                alert('Failed to fetch stock price');
            }
        })
        .catch(error => {
            console.error('Error fetching stock price:', error);
        });
}

// Function to preview the order
document.getElementById('previewBtn').addEventListener('click', function () {
    const quantity = document.getElementById('quantity').value;
    const price = document.getElementById('price').value || 'Market Price';  // Use the selected price

    if (quantity && price) {
        const orderType = document.getElementById('buyBtn').classList.contains('selected') ? 'Buy' : 'Sell';
        
        // Display order details in the confirmation dialog
        document.getElementById('orderDetails').innerHTML = `
            <p><strong>Order Type:</strong> ${orderType}</p>
            <p><strong>Stock:</strong> ${selectedStockSymbol}</p>
            <p><strong>Quantity:</strong> ${quantity}</p>
            <p><strong>Price:</strong> ${price}</p>
        `;

        // Show the modal
        document.getElementById('confirmationDialog').style.display = 'block';
    } else {
        alert('Please enter both quantity and price.');
    }
});

// Close the confirmation dialog
document.querySelector('.close-btn').addEventListener('click', function () {
    document.getElementById('confirmationDialog').style.display = 'none';
});

// Confirm order logic
document.getElementById('confirmOrderBtn').addEventListener('click', function () {
    const orderType = document.getElementById('buyBtn').classList.contains('selected') ? 'Buy' : 'Sell';
    const quantity = document.getElementById('quantity').value;
    const price = document.getElementById('price').value || 'Market Price';

    alert(`${orderType} order confirmed! Stock: ${selectedStockSymbol}, Quantity: ${quantity}, Price: ${price}`);
    
    // Close the dialog after confirmation
    document.getElementById('confirmationDialog').style.display = 'none';
});

// Buy/Sell button toggle
document.getElementById('buyBtn').addEventListener('click', function () {
    this.classList.add('selected');
    document.getElementById('sellBtn').classList.remove('selected');
});

document.getElementById('sellBtn').addEventListener('click', function () {
    this.classList.add('selected');
    document.getElementById('buyBtn').classList.remove('selected');
});







// Event listener for Buy and Sell buttons
document.getElementById('buyBtn').addEventListener('click', () => submitOrder('buy'));
document.getElementById('sellBtn').addEventListener('click', () => submitOrder('sell'));

function submitOrder(orderType) {
    const quantity = document.getElementById('quantity').value;
    const price = document.getElementById('price').value;
    const stock = document.getElementById('stockDropdown').value;

    if (!quantity || !price || !stock) {
        displayMessage('Please provide all required details', 'orderMessage');
        return;
    }

    const totalValue = quantity * price;
    const orderDetails = `Type: ${orderType}, Stock: ${stock}, Quantity: ${quantity}, Price: $${price}, Total: $${totalValue}`;
    
    // Display confirmation dialog
    document.getElementById('orderDetails').textContent = orderDetails;
    document.getElementById('confirmationDialog').style.display = 'block';
    
    // Confirm order on clicking 'Confirm'
    document.getElementById('confirmOrderButton').onclick = () => {
        placeOrder(orderType, stock, quantity, price, totalValue);
    };

    // Cancel the order
    document.getElementById('cancelOrderButton').onclick = () => {
        document.getElementById('confirmationDialog').style.display = 'none';
    };
}


// Place order function
function placeOrder(orderType, stock, quantity, price, totalValue) {
    fetch('/place_order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            stock: stock,
            order_type: orderType,
            quantity: quantity,
            price: price,
            total_value: totalValue
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayMessage('Order placed successfully!', 'orderMessage');
        } else {
            displayMessage('Order failed: ' + data.message, 'orderMessage');
        }
        document.getElementById('confirmationDialog').style.display = 'none'; // Close the confirmation dialog
    });
}

// Function to display messages
function displayMessage(message, elementId) {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.style.color = 'green';  // Set success message color
}

$(document).ready(function() {
    $('#orderType, #timeInForce').change(function() {
        const orderType = $('#orderType').val();
        const timeInForce = $('#timeInForce').val();
        let message = `You have selected a ${orderType} order.`;

        if (timeInForce === 'gtc') {
            message += " This order will remain open until you cancel it.";
        } else {
            message += " This order will be good only for today.";
        }

        $('#orderDetailsMessage').text(message);
    });
});


$(document).ready(function() {
    fetchPortfolioOverview();
});

function fetchPortfolioOverview() {
    $.ajax({
        url: '/portfolio_overview',
        method: 'GET',
        success: function(data) {
            if (data.error) {
                console.error(data.error);  // Log the error if there is one
                $('#portfolioError').text(data.error);  // Display error to the user (optional)
            } else {
                updatePortfolioOverview(data);  // Update the UI with portfolio data
            }
        },
        error: function(err) {
            console.error('Error fetching portfolio overview:', err);  // Log the error
            $('#portfolioError').text('Failed to fetch portfolio data. Please try again later.');
        }
    });
}

function updatePortfolioOverview(data) {
    // Check if balance and currency exist in the response
    if (data.balance !== undefined && data.currency !== undefined) {
        // Update current balance
        $('#currentBalance').text(`${data.balance} ${data.currency}`);
    } else {
        console.error('Balance or currency missing from response');
        $('#portfolioError').text('Balance or currency data missing.');
    }

    // Ensure transactions exist in the response
    if (data.transactions) {
        // Calculate total investment and unrealized profit/loss
        const totalInvestment = calculateTotalInvestment(data.transactions);
        const unrealizedProfitLoss = calculateUnrealizedProfitLoss(data.transactions, data.balance);

        // Update investment overview
        $('#totalInvestment').text(`Total Investment: ${totalInvestment} ${data.currency}`);
        $('#unrealizedProfitLoss').text(`Unrealized Profit/Loss: ${unrealizedProfitLoss} ${data.currency}`);
    } else {
        console.error('Transactions data missing from response');
        $('#portfolioError').text('Transaction data missing.');
    }
}

// Calculate total investment from transactions
function calculateTotalInvestment(transactions) {
    let totalInvestment = 0;
    transactions.forEach(transaction => {
        if (transaction.transaction_type === 'buy') {
            totalInvestment += transaction.amount;
        }
    });
    return totalInvestment;
}

// Calculate unrealized profit/loss
function calculateUnrealizedProfitLoss(transactions, currentBalance) {
    let profitLoss = 0;
    transactions.forEach(transaction => {
        if (transaction.transaction_type === 'sell') {
            profitLoss += (transaction.amount - currentBalance);  // Simplified for demonstration
        }
    });
    return profitLoss;
}

$(document).ready(function () {
    fetchTransactions();

    function fetchTransactions() {
        $.ajax({
            url: '/api/transactions', // Adjust the API endpoint as necessary
            type: 'GET',
            success: function (data) {
                displayTransactions(data);
            },
            error: function (error) {
                console.error('Error fetching transactions:', error);
                $('#noTransactionsMessage').show();
            }
        });
    }

    function displayTransactions(transactions) {
        const transactionBody = $('#transactionBody');
        transactionBody.empty(); // Clear previous transactions

        if (transactions.length === 0) {
            $('#noTransactionsMessage').show();
            return;
        } else {
            $('#noTransactionsMessage').hide();
        }

        transactions.forEach(transaction => {
            const row = `
                <tr>
                    <td>${transaction.transaction_id}</td>
                    <td>${transaction.stock_symbol}</td>
                    <td>${transaction.order_type}</td>
                    <td>${transaction.stock_symbol}</td>
                    <td>${transaction.price.toFixed(2)}</td>
                    <td>${transaction.quantity}</td>
                    <td>${(transaction.quantity * transaction.price).toFixed(2)}</td>
                    <td>${new Date(transaction.created_at).toLocaleString()}</td>
                    <td>${transaction.status}</td>
                </tr>
            `;
            transactionBody.append(row);
        });
    }
});







// Function to fetch stock performance data
async function fetchStockPerformance(stockSymbol) {
    try {
        const response = await fetch(`/api/performance/${stockSymbol}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        renderPerformanceGraph();
    } catch (error) {
        console.error('Error fetching stock performance:', error);
    }
}

// Function to fetch portfolio impact data
async function fetchPortfolioImpact() {
    try {
        const response = await fetch(`/api/portfolio_impact`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const impactData = await response.json();
        renderPortfolioImpactGraph(impactData);
        displayPortfolioImpact(impactData);
    } catch (error) {
        console.error('Error fetching portfolio impact:', error);
    }
}

let marketSentimentGraph; // Declare the variable for the chart instance globally

async function fetchMarketSentiment(stockSymbol) {
    try {
        // Make a GET request to the market sentiment endpoint
        const response = await fetch(`http://127.0.0.1:5000/api/market_sentiment/${stockSymbol}`);

        // Check if the response is OK (status code in the range 200-299)
        if (!response.ok) {
            throw new Error(`Error fetching market sentiment: ${response.statusText}`);
        }

        // Parse the JSON response
        const sentimentData = await response.json();
        console.log("Market Sentiment:", sentimentData);

        // Render the sentiment data on the market sentiment graph
        renderMarketSentimentGraph(sentimentData);

    } catch (error) {
        console.error("Failed to fetch market sentiment:", error);
    }
}


function renderPerformanceGraph() {
    const ctx = document.getElementById('performanceGraph').getContext('2d');
    const labels = ['2024-10-14', '2024-10-13', '2024-10-12'];
    const closingPrices = [150, 148, 147];

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Closing Price',
                data: closingPrices,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: false,
                },
            },
        }
    });
}


// Function to render portfolio impact graph
function renderPortfolioImpactGraph(impactData) {
    const ctx = document.getElementById('portfolioImpactGraph').getContext('2d');
    
    // Example data for the Portfolio Impact Graph
    const investmentData = impactData.total_investment || 0;
    const balance = impactData.balance || 0;
    const labels = ['Total Investment', 'Current Balance', 'Unrealized P/L'];
    const data = [investmentData, balance, impactData.unrealized_profit_loss];

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Portfolio Impact',
                data: data,
                backgroundColor: [
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(255, 99, 132, 0.5)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Function to render the market sentiment graph using Chart.js
function renderMarketSentimentGraph(sentimentData) {
    const ctx = document.getElementById('marketSentimentGraph').getContext('2d');

    // If there's an existing chart, destroy it before creating a new one
    if (window.marketSentimentGraph) {
        // window.marketSentimentGraph.destroy();
    }

    // Map the sentiment label to a numerical value
    const sentimentValue = sentimentData.sentiment_score * 100; // Scale to percentage (0-100)
    const oppositeSentimentValue = 100 - sentimentValue; // Calculate the opposite sentiment

    // Create the new chart
    window.marketSentimentGraph = new Chart(ctx, {
        type: 'doughnut', // You can change this to another type of chart if you want
        data: {
            labels: [sentimentData.sentiment_label, 'Opposite Sentiment'], // Adjust labels based on your sentiment data
            datasets: [{
                label: 'Market Sentiment',
                data: [sentimentValue, oppositeSentimentValue],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)', // Color for the actual sentiment
                    'rgba(255, 99, 132, 0.6)'  // Color for the opposite sentiment
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Current Market Sentiment'
                }
            }
        }
    });
}



// Function to display portfolio impact data
function displayPortfolioImpact(impactData) {
    const impactContainer = document.getElementById('portfolioImpactContainer'); // Assuming you have a container for this
    impactContainer.innerHTML = `
        <p>Balance: $${impactData.balance.toFixed(2)}</p>
        <p>Total Investment: $${impactData.total_investment.toFixed(2)}</p>
        <p>Unrealized Profit/Loss: $${impactData.unrealized_profit_loss.toFixed(2)}</p>
    `;
}

// Example calls (You can replace 'AAPL' and 'username' with actual values)
// fetchStockPerformance(selectedStock);  // Replace with the actual stock symbol
fetchPortfolioImpact(); // Replace with the actual username
// renderMarketSentimentGraph(); // Render the market sentiment graph
// fetchMarketSentiment();

function addStockSymbolForMarketSentiment(selectedStockSymbol) {
    fetchStockPerformance(selectedStockSymbol);
    fetchMarketSentiment(selectedStockSymbol);
}






async function fetchStockInfo(stockSymbol) {
    try {
        const response = await fetch(`/api/stock_info/${stockSymbol}`);
        const stockData = await response.json();

        // Handle N/A values in a user-friendly way
        document.getElementById('stockSymbol').textContent = `Stock Symbol: ${stockData.symbol}`;
        document.getElementById('stockPrice').textContent = stockData.price !== "N/A" ? `₹${stockData.price.toFixed(2)}` : "Price Not Available";
        document.getElementById('stockVolume').textContent = stockData.volume !== "N/A" ? `${stockData.volume.toLocaleString()}` : "N/A";
        document.getElementById('marketCap').textContent = stockData.market_cap !== "N/A" ? `₹${(stockData.market_cap / 1e9).toFixed(2)}B` : "N/A";
        document.getElementById('peRatio').textContent = stockData.pe_ratio !== "N/A" ? stockData.pe_ratio.toFixed(2) : "N/A";
        document.getElementById('dividendYield').textContent = stockData.dividend_yield !== "N/A" ? `${(stockData.dividend_yield * 100).toFixed(2)}%` : "N/A";
        document.getElementById('weekHigh').textContent = stockData.week_high !== "N/A" ? `₹${stockData.week_high.toFixed(2)}` : "N/A";
        document.getElementById('weekLow').textContent = stockData.week_low !== "N/A" ? `₹${stockData.week_low.toFixed(2)}` : "N/A";
        document.getElementById('earningsDate').textContent = stockData.earnings_date !== "N/A" ? new Date(stockData.earnings_date).toLocaleDateString() : "N/A";
        document.getElementById('dividendDate').textContent = stockData.dividend_date !== "N/A" ? new Date(stockData.dividend_date).toLocaleDateString() : "N/A";

        
        // Handle price change coloring
        const priceChangeElement = document.getElementById('priceChange');
        if (stockData.price_change < 0) {
            priceChangeElement.classList.remove('positive');
            priceChangeElement.classList.add('negative');
        } else {
            priceChangeElement.classList.remove('negative');
            priceChangeElement.classList.add('positive');
        }

    } catch (error) {
        console.error('Error fetching stock data:', error);
    }
}


