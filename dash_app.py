import dash
from dash import dcc, html, Input, Output
import yfinance as yf
import plotly.graph_objs as go
from urllib.parse import parse_qs

# Initialize the Dash dash_app
dash_app = dash.Dash(__name__)

# Layout of the dash_app
dash_app.layout = html.Div([
    dcc.Location(id='url', refresh=False),
    dcc.Dropdown(
        id='chart-type-dropdown',
        options=[
            {'label': 'Candlestick', 'value': 'candlestick'},
            {'label': 'Line', 'value': 'line'},
            {'label': 'OHLC', 'value': 'ohlc'},
            {'label': 'Bar', 'value': 'bar'}
        ],
        value='candlestick',
        clearable=False
    ),
    dcc.Graph(id='live-stock-graph', style={'height': '700px', 'width': '100%'}),
    dcc.Interval(id='interval-component', interval=10 * 1000, n_intervals=0),
    dcc.Input(id='stock-input', value='', type='hidden')
])

# Callback to update the graph based on stock symbol, timeframe, and chart type
@dash_app.callback(
    Output('live-stock-graph', 'figure'),
    Input('url', 'search'),
    Input('chart-type-dropdown', 'value')
)
def update_graph(search, chart_type):
    params = parse_qs(search[1:])
    stock_symbol = params.get('stock', [None])[0]
    timeframe = params.get('timeframe', ['1d'])[0]
    print(stock_symbol, timeframe, chart_type)

    if not stock_symbol:
        return go.Figure()

    # Determine the period and interval based on timeframe
    if timeframe == '1 day':
        period = '1d'
        interval = '1m'
    elif timeframe == '5 days':
        period = '5d'
        interval = '5m'
    elif timeframe == '1 month':
        period = '1mo'
        interval = '1d'
    elif timeframe == '1 year':
        period = '1y'
        interval = '1d'

    stock_data = yf.download(f"{stock_symbol}.NS", period=period, interval=interval)

    if stock_data.empty:
        return go.Figure()

    fig = go.Figure()

    # Determine chart type based on user selection
    if chart_type == 'candlestick':
        fig.add_trace(go.Candlestick(
            x=stock_data.index,
            open=stock_data['Open'],
            high=stock_data['High'],
            low=stock_data['Low'],
            close=stock_data['Close'],
            name='Candlestick'
        ))
    elif chart_type == 'line':
        fig.add_trace(go.Scatter(
            x=stock_data.index,
            y=stock_data['Close'],
            mode='lines',
            name='Line'
        ))
    elif chart_type == 'ohlc':
        fig.add_trace(go.Ohlc(
            x=stock_data.index,
            open=stock_data['Open'],
            high=stock_data['High'],
            low=stock_data['Low'],
            close=stock_data['Close'],
            name='OHLC'
        ))
    elif chart_type == 'bar':
        fig.add_trace(go.Bar(
            x=stock_data.index,
            y=stock_data['Close'],
            name='Bar'
        ))

    # Update layout to remove gaps between non-trading hours
    fig.update_layout(
        title=f'{stock_symbol} Live Price',
        xaxis_title='Time',
        yaxis_title='Price',
        xaxis_rangeslider_visible=False,
    xaxis=dict(
        rangebreaks=[
            dict(bounds=["sat", "mon"]),  # Remove weekends
            dict(bounds=["16:00", "09:30"])
        ]
        )
    )

    return fig

# Run the dash_app
if __name__ == '__main__':
    dash_app.run_server(debug=True)
