from flask import Flask, render_template, redirect, url_for, flash, request, session, jsonify
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_pymongo import PyMongo
from forms import RegistrationForm, LoginForm
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
from bson import ObjectId
from flask_mail import Mail, Message
import jwt  # Importing JWT for token generation
import os  # For getting environment variables
import random  # For generating random OTPs
import dash
from dash import dcc, html
from dash.dependencies import Output, Input
import plotly.graph_objs as go

app = Flask(__name__)
app.secret_key = '1718'  # Replace with a random secret key

# MongoDB configuration
app.config['MONGO_URI'] = 'mongodb://localhost:27017/tradeboon1'  # Update with your MongoDB URI
mongo = PyMongo(app)
# print("mongo",mongo)
# print(mongo.db.users.find_one({"username": "dev123"}))

# Mail settings
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'shreeji1801@gmail.com'
app.config['MAIL_PASSWORD'] = 'sinb jjtm vzoq what'

mail = Mail(app)

otp_storage = {}  # Temporary storage for OTPs

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

class User(UserMixin):
    def __init__(self, username, password_hash, user_id=None, email=None):
        self.username = username
        self.password_hash = password_hash
        self.user_id = user_id  # Store MongoDB _id
        self.email = email

    @staticmethod
    def get_user_by_username(username):
        print(f"Looking for user with username: {username}")
        user_data = mongo.db.users.find_one({'username': username})
        if user_data:
            print(f"User found: {user_data}")
            email = user_data['email']
            return User(
                username=user_data['username'],
                password_hash=user_data['password_hash'],
                user_id=str(user_data['_id'])  # Store as string
            )
        print("User not found!")
        return None

    @staticmethod
    def get_user_by_id(user_id):
        print(f"Looking for user with ID: {user_id}")
        user_data = mongo.db.users.find_one({'_id': ObjectId(user_id)})
        if user_data:
            print(f"User found: {user_data}")
            return User(
                username=user_data['username'],
                password_hash=user_data['password_hash'],
                user_id=str(user_data['_id'])
            )
        print("User not found by ID!")
        return None

    def get_id(self):
        return self.user_id  # Return user_id as string for Flask-Login


@login_manager.user_loader
def load_user(user_id):
    return User.get_user_by_id(user_id)  # Lookup user by _id from session

def generate_verification_token(email):
    return jwt.encode({'email': email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)}, app.secret_key, algorithm='HS256')

@app.route('/')
def home():
    return redirect(url_for('login'))  # Redirect to the login page

# @app.route('/register', methods=['GET', 'POST'])
# def register():
#     form = RegistrationForm()
#     if form.validate_on_submit():
#         if mongo.db.users.find_one({'username': form.username.data}):
#             flash('Username already exists!', 'danger')
#             return redirect(url_for('register'))

#         user = User(form.username.data, form.password.data)

#         # Convert date_of_birth from datetime.date to datetime.datetime
#         date_of_birth = datetime.datetime.combine(form.date_of_birth.data, datetime.datetime.min.time())

#         # Insert user data into the database with verification status set to 'pending'
#         mongo.db.users.insert_one({
#             'username': user.username,
#             'password_hash': generate_password_hash(user.password_hash),  # Store password hash
#             'email': form.email.data,
#             'full_name': form.full_name.data,
#             'date_of_birth': date_of_birth,
#             'phone_number': form.phone_number.data,
#             'government_id_type': form.government_id_type.data,
#             'government_id_number': form.government_id_number.data,
#             'government_id_image': 'path_to_image',  # Handle image upload separately
#             'verification_status': 'pending',
#             'created_at': datetime.datetime.utcnow(),
#             'updated_at': datetime.datetime.utcnow()
#         })

#         # Generate a random 6-digit OTP
#         otp = str(random.randint(100000, 999999))
#         otp_storage[form.email.data] = otp  # Store OTP temporarily

#         # Create and send the OTP email
#         msg = Message('Your OTP Code', sender=app.config['MAIL_USERNAME'], recipients=[form.email.data])
#         msg.body = f'Your OTP code is: {otp}'

        
#         mail.send(msg)
#         flash('Registration successful! Please check your email for the OTP.', 'success')
#         return redirect(url_for('verify_otp', email=form.data.email))  # Redirect to OTP verification page
        
#             # flash('Failed to send OTP email. Please try again.', 'danger')
#             # return redirect(url_for('register'))

#     return render_template('register.html', form=form)


@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegistrationForm()
    if form.validate_on_submit():
        if mongo.db.users.find_one({'username': form.username.data}):
            flash('Username already exists!', 'danger')
            return redirect(url_for('register'))
        
        user = User(form.username.data, form.password.data)

        # Convert date_of_birth from datetime.date to datetime.datetime
        date_of_birth = datetime.datetime.combine(form.date_of_birth.data, datetime.datetime.min.time())
        
        password_hash = generate_password_hash(user.password_hash)

        mongo.db.users.insert_one({
            'username': user.username,
            'password_hash': password_hash,
            'email': form.email.data,
            'full_name': form.full_name.data,
            'date_of_birth': date_of_birth,
            'phone_number': form.phone_number.data,
            'government_id_type': form.government_id_type.data,
            'government_id_number': form.government_id_number.data,
            'government_id_image': 'path_to_image',  # Handle image upload separately
            'verification_status': 'pending',
            'created_at': datetime.datetime.utcnow(),
            'updated_at': datetime.datetime.utcnow()
        })
        
        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html', form=form)     

@app.route('/verify_otp', methods=['GET', 'POST'])
def verify_otp():
    if request.method == 'POST':
        data = request.form
        email = data.get('email')
        entered_otp = data.get('otp')
        print(email)
        print(entered_otp)
        if email in otp_storage and otp_storage[email] == entered_otp:
            del otp_storage[email]  # Remove the OTP after successful verification
            # Update user's verification status in the database
            mongo.db.users.update_one({'email': email}, {'$set': {'verification_status': 'verified'}})
            flash('OTP verified successfully! Please log in.', 'success')
            return redirect(url_for('login', email=email))
        else:
            print("hhhh")
            flash('Invalid OTP. Please try again.', 'danger')

    return render_template('verify_otp.html')  # Make sure to create this template


@app.route('/login', methods=['GET','POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        # print((form.username.data))
        user1 = User.get_user_by_username(form.username.data)
        
        if user1 is None:
            flash('No account with this username exists.', 'danger')
            return redirect(url_for('login'))
        
        if check_password_hash(user1.password_hash, form.password.data):
            login_user(user1)
            flash('Login successful!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Incorrect password. Please try again.', 'danger')
    
    return render_template('login.html', form=form)


# Mock data for stocks breakdown
stocks_data = [
    {"symbol": "AAPL", "shares": 10, "purchase_price": 150, "current_price": 175},
    {"symbol": "GOOGL", "shares": 5, "purchase_price": 2800, "current_price": 2900},
    {"symbol": "TSLA", "shares": 8, "purchase_price": 900, "current_price": 850},
    {"symbol": "AMZN", "shares": 3, "purchase_price": 3200, "current_price": 3500},
]
# Mock data for recent transactions
recent_transactions = [
    {"symbol": "AAPL", "type": "buy", "shares": 10, "price_per_share": 150, "total_value": 1500, "date": datetime.datetime(2024, 10, 10, 14, 30)},
    {"symbol": "GOOGL", "type": "sell", "shares": 5, "price_per_share": 2800, "total_value": 14000, "date": datetime.datetime(2024, 10, 11, 9, 45)},
    {"symbol": "TSLA", "type": "buy", "shares": 8, "price_per_share": 900, "total_value": 7200, "date": datetime.datetime(2024, 10, 12, 11, 15)},
    {"symbol": "AMZN", "type": "sell", "shares": 3, "price_per_share": 3500, "total_value": 10500, "date": datetime.datetime(2024, 10, 12, 13, 50)},
]

# Sample stock data for demonstration
stocks = [
        {'date': '2024-10-01', 'price': 100},
        {'date': '2024-10-02', 'price': 105},
        {'date': '2024-10-03', 'price': 102},
        {'date': '2024-10-04', 'price': 108},
        {'date': '2024-10-05', 'price': 110},
]

@app.route('/dashboard')
@login_required
def dashboard():
    username = current_user.username  # Current logged-in user's username
    
    
    # Example data, you should replace it with actual data fetching
    top_gainers = ["AAPL +2.5%", "GOOGL +1.8%", "AMZN +1.2%"]
    top_losers = ["TSLA -3.5%", "NFLX -2.2%"]
    user_balance = 10000  # Example balance, fetch from database
    transactions = ["Bought 10 shares of AAPL", "Sold 5 shares of TSLA"]

    # Calculate profit/loss for each stock
    for stock in stocks_data:
        stock['profit_loss'] = ((stock['current_price'] - stock['purchase_price']) / stock['purchase_price']) * 100

    # Prepare data for the stock price graph
    dates = [stock['date'] for stock in stocks]
    prices = [stock['price'] for stock in stocks]

    # Create a line chart for stock prices
    fig1 = go.Figure()
    fig1.add_trace(go.Scatter(x=dates, y=prices, mode='lines+markers', name='Stock Price'))
    fig1.update_layout(title='Stock Prices Over Time',
                       xaxis_title='Date',
                       yaxis_title='Price',
                       template='plotly_white')

    # Prepare data for the transactions bar chart
    transaction_types = [t['type'] for t in recent_transactions]
    total_values = [t['total_value'] for t in recent_transactions]

    # Create a bar chart for recent transactions
    fig2 = go.Figure()
    fig2.add_trace(go.Bar(x=transaction_types, y=total_values, name='Transaction Value'))
    fig2.update_layout(title='Recent Transactions',
                       xaxis_title='Transaction Type',
                       yaxis_title='Total Value',
                       template='plotly_white')

    # Convert figures to JSON
    stock_graphJSON = fig1.to_json()
    transaction_graphJSON = fig2.to_json()

    return render_template('dashboard.html', 
                           username=username, 
                           top_gainers=top_gainers, 
                           top_losers=top_losers,
                           user_balance=user_balance,
                           stocks=stocks_data,
                           transactions=recent_transactions,
                           stock_graphJson=stock_graphJSON,
                           transaction_graphJSON=transaction_graphJSON)

@app.route("/news")
@login_required
def news():
    return render_template("news.html")

@app.route("/about")
@login_required
def about():
    return render_template("about.html")

@app.route('/buy_sell', methods=['POST'])
@login_required  # Ensure user is logged in
def buy_sell():
    stock_symbol = request.form['stock_symbol']
    quantity = int(request.form['quantity'])
    action = request.form['action']

    # Logic for buying or selling stocks
    if action == 'buy':
        # Handle the stock buying logic
        flash(f'You bought {quantity} shares of {stock_symbol}.', 'success')
    elif action == 'sell':
        # Handle the stock selling logic
        flash(f'You sold {quantity} shares of {stock_symbol}.', 'success')
    else:
        flash('Invalid action.', 'danger')

    return redirect(url_for('dashboard'))

# Real-time updating chart in Dash
X = [0]
Y = [random.randint(0, 100)]

# Initialize Dash app
dash_app = dash.Dash(__name__, server=app, url_base_pathname='/dashboard/')
dash_app.layout = html.Div(
    [
        dcc.Graph(id='live-graph', animate=True),
        dcc.Interval(id='graph-update', interval=10000),  # Update every second
    ]
)

# # Callback to update the graph
# @dash_app.callback(
#     Output('live-graph', 'figure'),
#     Input('graph-update', 'n_intervals')
# )
# def update_graph_scatter(n):
#     global X, Y
#     X.append(X[-1] + 1)  # Increment time
#     Y.append(random.randint(0, 100))  # Random value

#     if len(X) > 50:  # Keep last 50 points
#         X = X[-50:]
#         Y = Y[-50:]

#     data = go.Scatter(
#         x=X,
#         y=Y,
#         mode='lines+markers'
#     )

#     return {'data': [data], 'layout': go.Layout(xaxis=dict(range=[min(X), max(X)]),
#                                                 yaxis=dict(range=[0, 100]))}


@app.route("/trade")
def trade():
    return render_template("trade.html")
    


@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'success')
    return redirect(url_for('login'))


from flask import Flask, request, jsonify
import yfinance as yf
import pandas as pd

@app.route('/api/data')
def get_stock_data():
    symbol = request.args.get('symbol')
    date_range = request.args.get('dateRange', '1y')  # Default to 1 year
    symbol = f"{symbol}.NS"  # Append .NS for NSE stocks
    stock_data = yf.download(symbol, period=date_range, interval='1d')

    if stock_data.empty:
        return jsonify({'error': 'No data found for the symbol.'})

    response_data = {
        'dates': stock_data.index.strftime('%Y-%m-%d').tolist(),
        'opens': stock_data['Open'].tolist(),
        'highs': stock_data['High'].tolist(),
        'lows': stock_data['Low'].tolist(),
        'closes': stock_data['Close'].tolist()
    }

    return jsonify(response_data)


# Define an endpoint to fetch the real-time stock price
@app.route('/api/get_stock_price', methods=['GET'])
def get_stock_price():
    stock_symbol = request.args.get('stock_symbol')  # Get the stock symbol from the query parameters

    if not stock_symbol:
        return jsonify({'error': 'Stock symbol is required'}), 400

    try:
        stock_data = yf.Ticker(f"{stock_symbol}.NS")  # Append .NS for NSE stocks
        stock_price = stock_data.history(period='1d')['Close'][0]  # Get the latest closing price

        return jsonify({'stock_symbol': stock_symbol, 'price': stock_price}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

import time
from threading import Timer

def simulate_order_execution(order_id):
    time.sleep(10)  # Simulate a delay for order execution (10 seconds)
    mongo.db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {
            "status": "Executed",
            "updated_at": datetime.datetime.utcnow()
        }}
    )
    print(f"Order {order_id} has been executed.")

# Route to handle order placement
@app.route('/place_order', methods=['POST'])
def place_order():
    data = request.json
    
    stock_symbol = data.get('stock')
    order_type = data.get('order_type')
    quantity = data.get('quantity')
    price = data.get('price')
    total_value = data.get('total_value')
    
    # Create and insert order into the database
    order = {
        "username": current_user.username,
        "stock_symbol": stock_symbol,
        "order_type": order_type,  # "buy" or "sell"
        "quantity": int(quantity),
        "price": float(price),
        "total_value": float(total_value),
        "status": "pending",  # Initial status of the order
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow(),
    }
    result = mongo.db.orders.insert_one(order)
    order_id = result.inserted_id

    # Simulate execution in 10 seconds
    Timer(10.0, simulate_order_execution, args=[order_id]).start()

    return jsonify({'success': True, 'message': 'Order placed successfully!', "order_id": str(order_id)})




from bson import ObjectId  # Ensure this import is included at the top of your file

@app.route('/portfolio_overview', methods=['GET'])
def portfolio_overview():
    try:
        if current_user.is_authenticated:
            username = current_user.username  # Get username from current_user
            print(f"Fetching account for username: {username}")

            account = mongo.db.accounts.find_one({"username": username})
            if account:
                # Convert ObjectId of the account to string
                account['_id'] = str(account['_id'])

                # Convert ObjectId of each transaction to string, if present
                for transaction in account.get('transactions', []):
                    transaction['transaction_id'] = str(transaction['transaction_id'])  # Convert each transaction ID

                return jsonify({
                    "balance": account.get('balance', 0),
                    "currency": account.get('currency', 'INR'),
                    "transactions": account.get('transactions', []),  # Ensure transactions exist
                }), 200
            else:
                print(f"Account not found for username: {username}")
                return jsonify({"error": "Account not found"}), 404
        else:
            print("User not authenticated")
            return jsonify({"error": "User not authenticated"}), 401
    except Exception as e:
        print(f"Error in portfolio_overview: {str(e)}")
        return jsonify({"error": "Internal Server Error"}), 500




@app.route('/api/transactions', methods=['GET'])
@login_required
def get_transactions():
    username = current_user.username
    # print(username)
    transactions = mongo.db.orders.find({"username": username})  # Fetch transactions by username
    # print("transaction", transactions)
    
    transaction_list = []
    for transaction in transactions:
        transaction['_id'] = str(transaction['_id'])  # Convert ObjectId to string
        transaction["transaction_id"] = transaction["_id"]
        transaction_list.append(transaction)

    # print(transaction_list)
    return jsonify(transaction_list)



@app.route('/api/fetch_stock_performance/<string:stock_symbol>', methods=['GET'])
def fetch_stock_performance(stock_symbol):
    # Fetch historical data for the last 30 days
    stock_symbol = f"{stock_symbol}.NS"  # Append .NS for NSE stocks
    stock_data = yf.download(stock_symbol, period='30d')

    # Prepare the data for MongoDB insertion
    performance_records = []
    for date, row in stock_data.iterrows():
        record = {
            "stock_symbol": stock_symbol,
            "date": datetime.strptime(str(date.date()), '%Y-%m-%d'),  # Convert to datetime
            "opening_price": row['Open'],
            "closing_price": row['Close'],
            "high_price": row['High'],
            "low_price": row['Low'],
            "volume": row['Volume']
        }
        performance_records.append(record)

    # Insert records into MongoDB
    if performance_records:
        mongo.db.stock_performance.insert_many(performance_records)

    return jsonify({"message": "Stock performance data fetched and stored successfully."})


@app.route('/api/portfolio_impact', methods=['GET'])
def get_portfolio_impact():
    # Fetch the user's account data
    account_data = mongo.db.accounts.find_one({"username": current_user.username})
    
    # Assume total investment and unrealized profit/loss is calculated here
    # You may want to implement your own logic for this
    total_investment = sum(transaction["amount"] for transaction in account_data['transactions'])
    unrealized_profit_loss = account_data['balance'] - total_investment

    # Prepare the impact data
    impact_data = {
        "balance": account_data["balance"],
        "total_investment": total_investment,
        "unrealized_profit_loss": unrealized_profit_loss
    }
    
    return jsonify(impact_data)

@app.route('/api/performance/<string:stock_symbol>', methods=['GET'])
def get_performance_data(stock_symbol):
    # Fetch stock performance data from the stock_performance collection
    performance_data = list(mongo.db.stock_performance.find({"stock_symbol": stock_symbol}))
    
    # Format the data for JSON response
    formatted_data = [
        {
            "date": record["date"].isoformat(),
            "closing_price": record["closing_price"],
            "opening_price": record["opening_price"],
            "high_price": record["high_price"],
            "low_price": record["low_price"],
            "volume": record["volume"]
        }
        for record in performance_data
    ]

    return jsonify(formatted_data)

# @app.route('/api/market_sentiment', methods=['GET'])
# def get_market_sentiment():
#     # Simulated market sentiment data
#     # In a real application, you would fetch this data from a data source or perform some calculations
#     sentiment_data = {
#         "bullish": random.randint(50, 100),  # Simulating bullish sentiment percentage
#         "bearish": random.randint(0, 50)     # Simulating bearish sentiment percentage
#     }
    
#     # Ensure that the total does not exceed 100%
#     total = sentiment_data["bullish"] + sentiment_data["bearish"]
#     if total > 100:
#         sentiment_data["bullish"] = 100 - sentiment_data["bearish"]

#     return jsonify(sentiment_data)


import requests
from flask import jsonify

ALPHA_VANTAGE_API_KEY = 'GR7UMM5T7UNKTPIE'  # Replace with your actual API keyd
ALPHA_VANTAGE_API_KEY = 'CH5MWRZ5I82CVCT2'  # Replace with your actual API key
ALPHA_VANTAGE_API_KEY = 'FR3CEVAG9RTZBCEH'  # Replace with your actual API key
ALPHA_VANTAGE_API_KEY = 'QA0M6Z22951Y4OHA'  # Replace with your actual API key

@app.route('/api/market_sentiment/<string:stock_symbol>', methods=['GET'])
def get_market_sentiment(stock_symbol):
    print(stock_symbol)
    # stock_symbol = 'AAPL'  # Example stock symbol
    url = f'https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers={stock_symbol}&apikey={ALPHA_VANTAGE_API_KEY}'

    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an error for bad responses

        sentiment_data = response.json()
        print("API response:", sentiment_data)    # Log the entire response for debugging

        # Check if 'feed' exists and has elements
        if 'feed' in sentiment_data and sentiment_data['feed']:
            # Extract overall sentiment score and label
            overall_sentiment = sentiment_data['feed'][0]  # Get the first news item for simplicity
            sentiment_score = overall_sentiment['overall_sentiment_score']
            sentiment_label = overall_sentiment['overall_sentiment_label']
            
            # Construct the response data
            market_sentiment = {
                "sentiment_score": sentiment_score,
                "sentiment_label": sentiment_label,
            }

            return jsonify(market_sentiment)
        else:
            print("No feed data found in response:", sentiment_data)
            return jsonify({"error": "No sentiment data available"}), 404

    except requests.exceptions.HTTPError as e:
        print("HTTP error:", str(e))  # More specific logging for HTTP errors
        return jsonify({"error": "Failed to fetch market sentiment data"}), 500
    except requests.exceptions.RequestException as e:
        print("Request error:", str(e))
        return jsonify({"error": "Failed to fetch market sentiment data"}), 500
    except Exception as e:
        print("An error occurred:", str(e))
        return jsonify({"error": str(e)}), 500

import yfinance as yf
from flask import jsonify, request

@app.route('/api/stock_info/<string:stock_symbol>', methods=['GET'])
def get_real_time_stock_info(stock_symbol):
    try:
        stock = yf.Ticker(f"{stock_symbol}.NS")  # Append .NS for NSE stocks
        stock_info = stock.info
        # print(stock_info)

        stock_data = {
            "symbol": stock_symbol,
            "price": stock_info.get("currentPrice", "N/A"),
            "volume": stock_info.get("volume", "N/A"),
            "market_cap": stock_info.get("marketCap", "N/A"),
            "pe_ratio": stock_info.get("trailingPE", "N/A"),
            "dividend_yield": stock_info.get("dividendYield", "N/A"),
            "week_high": stock_info.get("fiftyTwoWeekHigh", "N/A"),
            "week_low": stock_info.get("fiftyTwoWeekLow", "N/A"),
            "earnings_date": stock_info.get("earningsDate", "N/A"),
            "dividend_date": stock_info.get("dividendDate", "N/A")
        }

        # print(stock_data)

        return jsonify(stock_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}),500


if __name__ == '__main__':
    app.run(debug=True)


