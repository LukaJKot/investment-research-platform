from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import requests
from google import genai

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FMP_API_KEY = os.getenv("FMP_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

def get_income_statement(ticker: str):
    url = f"https://financialmodelingprep.com/stable/income-statement?symbol={ticker}&limit=5&apikey={FMP_API_KEY}"
    response = requests.get(url)
    try:
        data = response.json()
    except ValueError:
        return None
    if isinstance(data, dict):
        return None
    return data

def get_balance_sheet(ticker: str):
    url = f"https://financialmodelingprep.com/stable/balance-sheet-statement?symbol={ticker}&limit=5&apikey={FMP_API_KEY}"
    response = requests.get(url)
    try:
        data = response.json()
    except ValueError:
        return None
    if isinstance(data, dict):
        return None
    return data

def get_cash_flow(ticker: str):
    url = f"https://financialmodelingprep.com/stable/cash-flow-statement?symbol={ticker}&limit=5&apikey={FMP_API_KEY}"
    response = requests.get(url)
    try:
        data = response.json()
    except ValueError:
        return None
    if isinstance(data, dict):
        return None
    return data

def get_peers(ticker: str, target_market_cap):
    url = f"https://financialmodelingprep.com/stable/stock-peers?symbol={ticker}&apikey={FMP_API_KEY}"
    response = requests.get(url)
    try:
        data = response.json()
    except ValueError:
        return []
    if isinstance(data, dict) or not isinstance(data, list):
        return []

    reasonable_peers = [
        p for p in data
        if target_market_cap * 0.2 <= p["mktCap"] <= target_market_cap * 5
    ]
    reasonable_peers.sort(key=lambda p: abs(p["mktCap"] - target_market_cap))
    top_peers = reasonable_peers[:4]

    return [p["symbol"] for p in top_peers]  

def get_company_profile(ticker: str):
    url = f"https://financialmodelingprep.com/stable/profile?symbol={ticker}&apikey={FMP_API_KEY}"
    response = requests.get(url)
    try:
        data = response.json()
    except ValueError:
        return None
    if isinstance(data, dict) or not isinstance(data, list) or len(data) == 0:
        return None
    return data[0]      

def calculate_profitability_ratios(income_statement, balance_sheet):
    income = income_statement[0]
    balance_current = balance_sheet[0]

    revenue = income["revenue"]
    net_income = income["netIncome"]
    gross_profit = income["grossProfit"]

    if len(balance_sheet) >= 2:
        balance_previous = balance_sheet[1]
        avg_equity = (balance_current["totalStockholdersEquity"] + balance_previous["totalStockholdersEquity"]) / 2
        avg_assets = (balance_current["totalAssets"] + balance_previous["totalAssets"]) / 2
    else:
        avg_equity = balance_current["totalStockholdersEquity"]
        avg_assets = balance_current["totalAssets"]

    gross_margin = gross_profit / revenue
    net_margin = net_income / revenue
    roe = net_income / avg_equity
    roa = net_income / avg_assets

    return {
        "gross_margin": round(gross_margin, 4),
        "net_margin": round(net_margin, 4),
        "roe": round(roe, 4),
        "roa": round(roa, 4),
    }

def calculate_leverage_ratios(income_statement, balance_sheet):
    income = income_statement[0]
    balance = balance_sheet[0]

    total_debt = balance["totalDebt"]
    total_equity = balance["totalStockholdersEquity"]
    ebit = income["ebit"]
    interest_expense = income["interestExpense"]

    debt_to_equity = total_debt / total_equity
    interest_coverage = ebit / interest_expense if interest_expense != 0 else None

    return {
        "debt_to_equity": round(debt_to_equity, 4),
        "interest_coverage": round(interest_coverage, 4) if interest_coverage is not None else None,
    }

def calculate_liquidity_ratios(balance_sheet):
    balance = balance_sheet[0]

    current_assets = balance["totalCurrentAssets"]
    current_liabilities = balance["totalCurrentLiabilities"]
    inventory = balance["inventory"]

    current_ratio = current_assets / current_liabilities
    quick_ratio = (current_assets - inventory) / current_liabilities

    return {
        "current_ratio": round(current_ratio, 4),
        "quick_ratio": round(quick_ratio, 4),
    }

def calculate_growth_ratios(income_statement):
    if len(income_statement) < 2:
        return {
            "revenue_growth": None,
            "net_income_growth": None,
        }

    current = income_statement[0]
    previous = income_statement[1]

    current_revenue = current["revenue"]
    previous_revenue = previous["revenue"]
    current_net_income = current["netIncome"]
    previous_net_income = previous["netIncome"]

    revenue_growth = (current_revenue - previous_revenue) / previous_revenue
    net_income_growth = (current_net_income - previous_net_income) / previous_net_income

    return {
        "revenue_growth": round(revenue_growth, 4),
        "net_income_growth": round(net_income_growth, 4),
    }

def calculate_historical_trends(income_statement):
    trends = []
    for year_data in income_statement:
        trends.append({
            "fiscal_year": year_data["fiscalYear"],
            "revenue": year_data["revenue"],
            "net_income": year_data["netIncome"],
            "gross_margin": round(year_data["grossProfit"] / year_data["revenue"], 4),
        })
    trends.reverse()
    return trends

def get_peer_comparison(ticker: str):
    profile = get_company_profile(ticker)
    if profile is None:
        return []

    market_cap = profile["marketCap"]
    peer_tickers = get_peers(ticker, market_cap)

    comparison = []
    for peer_ticker in peer_tickers:
        peer_income = get_income_statement(peer_ticker)
        peer_balance_sheet = get_balance_sheet(peer_ticker)

        if peer_income is None or peer_balance_sheet is None:
            continue

        peer_profitability = calculate_profitability_ratios(peer_income, peer_balance_sheet)
        peer_leverage = calculate_leverage_ratios(peer_income, peer_balance_sheet)
        peer_liquidity = calculate_liquidity_ratios(peer_balance_sheet)
        peer_growth = calculate_growth_ratios(peer_income)

        peer_profitability_score = score_profitability(peer_profitability)
        peer_leverage_score = score_leverage(peer_leverage)
        peer_liquidity_score = score_liquidity(peer_liquidity)
        peer_growth_score = score_growth(peer_growth)

        peer_overall = calculate_overall_score(peer_profitability_score, peer_leverage_score, peer_liquidity_score, peer_growth_score)

        comparison.append({
            "ticker": peer_ticker,
            "overall_score": peer_overall["overall_score"],
            "rating": peer_overall["rating"],
        })

    return comparison    

def generate_research_memo(ticker, ratios, scoring, trends, peer_comparison):
    prompt = f"""You are a financial writing assistant. You will be given pre-calculated financial data for {ticker}. Your ONLY job is to explain and summarize this data in clear, professional prose, as if writing a short section of an equity research memo.

STRICT RULES:
- Do NOT calculate any new numbers or ratios.
- Do NOT contradict, second-guess, or override the given overall rating or category scores.
- Do NOT give personal investment advice or say whether someone should buy/sell.
- Only reference the data provided below. Do not invent facts.
- Keep it to 3-4 short paragraphs.

DATA:
Overall Score: {scoring['overall']['overall_score']}/100 ({scoring['overall']['rating']})

Profitability (35% weight, category score {scoring['profitability']['category_score']}/10):
- Gross Margin: {ratios['profitability']['gross_margin']} ({scoring['profitability']['gross_margin']['label']})
- Net Margin: {ratios['profitability']['net_margin']} ({scoring['profitability']['net_margin']['label']})
- ROE: {ratios['profitability']['roe']} ({scoring['profitability']['roe']['label']})
- ROA: {ratios['profitability']['roa']} ({scoring['profitability']['roa']['label']})

Leverage (25% weight, category score {scoring['leverage']['category_score']}/10):
- Debt-to-Equity: {ratios['leverage']['debt_to_equity']} ({scoring['leverage']['debt_to_equity']['label']})
- Interest Coverage: {ratios['leverage']['interest_coverage']} ({scoring['leverage']['interest_coverage']['label']})

Liquidity (15% weight, category score {scoring['liquidity']['category_score']}/10):
- Current Ratio: {ratios['liquidity']['current_ratio']} ({scoring['liquidity']['current_ratio']['label']})
- Quick Ratio: {ratios['liquidity']['quick_ratio']} ({scoring['liquidity']['quick_ratio']['label']})

Growth (25% weight, category score {scoring['growth']['category_score']}/10):
- Revenue Growth YoY: {ratios['growth']['revenue_growth']} ({scoring['growth']['revenue_growth']['label']})
- Net Income Growth YoY: {ratios['growth']['net_income_growth']} ({scoring['growth']['net_income_growth']['label']})

5-Year Trend: {trends}

Peer Comparison: {peer_comparison}

Write the memo now."""

    try:
        response = gemini_client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
        )
        return response.text
    except Exception:
        return "The AI research memo is temporarily unavailable due to high demand on our AI provider's servers. All scores and ratios above are unaffected and fully accurate — please try refreshing in a moment to generate the memo."
        

def score_metric(value, strong_threshold, weak_threshold, higher_is_better=True):
    if value is None:
        return {"points": 5, "label": "Average"}

    if higher_is_better:
        if value >= strong_threshold:
            return {"points": 10, "label": "Strong"}
        elif value < weak_threshold:
            return {"points": 0, "label": "Weak"}
        else:
            return {"points": 5, "label": "Average"}
    else:
        if value <= strong_threshold:
            return {"points": 10, "label": "Strong"}
        elif value > weak_threshold:
            return {"points": 0, "label": "Weak"}
        else:
            return {"points": 5, "label": "Average"}

def score_profitability(ratios):
    gross_margin = score_metric(ratios["gross_margin"], strong_threshold=0.40, weak_threshold=0.20)
    net_margin = score_metric(ratios["net_margin"], strong_threshold=0.15, weak_threshold=0.05)
    roe = score_metric(ratios["roe"], strong_threshold=0.20, weak_threshold=0.10)
    roa = score_metric(ratios["roa"], strong_threshold=0.08, weak_threshold=0.03)

    scores = [gross_margin, net_margin, roe, roa]
    average_points = sum(s["points"] for s in scores) / len(scores)

    return {
        "gross_margin": gross_margin,
        "net_margin": net_margin,
        "roe": roe,
        "roa": roa,
        "category_score": round(average_points, 2),
    }            

def score_leverage(ratios):
    debt_to_equity = score_metric(ratios["debt_to_equity"], strong_threshold=1.0, weak_threshold=2.0, higher_is_better=False)
    interest_coverage = score_metric(ratios["interest_coverage"], strong_threshold=8, weak_threshold=3)

    scores = [debt_to_equity, interest_coverage]
    average_points = sum(s["points"] for s in scores) / len(scores)

    return {
        "debt_to_equity": debt_to_equity,
        "interest_coverage": interest_coverage,
        "category_score": round(average_points, 2),
    }

def score_liquidity(ratios):
    current_ratio = score_metric(ratios["current_ratio"], strong_threshold=2.0, weak_threshold=1.0)
    quick_ratio = score_metric(ratios["quick_ratio"], strong_threshold=1.0, weak_threshold=0.5)

    scores = [current_ratio, quick_ratio]
    average_points = sum(s["points"] for s in scores) / len(scores)

    return {
        "current_ratio": current_ratio,
        "quick_ratio": quick_ratio,
        "category_score": round(average_points, 2),
    }       

def score_growth(ratios):
    revenue_growth = score_metric(ratios["revenue_growth"], strong_threshold=0.10, weak_threshold=0.0)
    net_income_growth = score_metric(ratios["net_income_growth"], strong_threshold=0.15, weak_threshold=0.0)

    scores = [revenue_growth, net_income_growth]
    average_points = sum(s["points"] for s in scores) / len(scores)

    return {
        "revenue_growth": revenue_growth,
        "net_income_growth": net_income_growth,
        "category_score": round(average_points, 2),
    }     

def calculate_overall_score(profitability_score, leverage_score, liquidity_score, growth_score):
    weighted_score = (
        (profitability_score["category_score"] / 10) * 35 +
        (growth_score["category_score"] / 10) * 25 +
        (leverage_score["category_score"] / 10) * 25 +
        (liquidity_score["category_score"] / 10) * 15
    )

    if weighted_score >= 85:
        rating = "Excellent"
    elif weighted_score >= 70:
        rating = "Strong"
    elif weighted_score >= 50:
        rating = "Average"
    elif weighted_score >= 30:
        rating = "Weak"
    else:
        rating = "Poor"

    return {
        "overall_score": round(weighted_score, 2),
        "rating": rating,
    }    
@app.get("/")
def read_root():
    return {"message": "Hello from your backend!"}

@app.get("/stock/{ticker}")
def get_stock(ticker: str):
    income = get_income_statement(ticker)
    balance_sheet = get_balance_sheet(ticker)
    cash_flow = get_cash_flow(ticker)

    if income is None or balance_sheet is None or cash_flow is None:
        return {"error": f"No data available for ticker '{ticker}'. It may not be covered by our data provider."}

    profitability = calculate_profitability_ratios(income, balance_sheet)
    leverage = calculate_leverage_ratios(income, balance_sheet)
    liquidity = calculate_liquidity_ratios(balance_sheet)
    growth = calculate_growth_ratios(income)
    trends = calculate_historical_trends(income)
    peer_comparison = get_peer_comparison(ticker)

    profitability_score = score_profitability(profitability)
    leverage_score = score_leverage(leverage)
    liquidity_score = score_liquidity(liquidity)
    growth_score = score_growth(growth)

    overall = calculate_overall_score(profitability_score, leverage_score, liquidity_score, growth_score)
    memo = generate_research_memo(ticker, {"profitability": profitability, "leverage": leverage, "liquidity": liquidity, "growth": growth}, {"overall": overall, "profitability": profitability_score, "leverage": leverage_score, "liquidity": liquidity_score, "growth": growth_score}, trends, peer_comparison)


    return {
        "ticker": ticker,
        "income_statement": income,
        "balance_sheet": balance_sheet,
        "cash_flow": cash_flow,
        "trends": trends,
        "peer_comparison": peer_comparison,
        "ratios": {
            "profitability": profitability,
            "leverage": leverage,
            "liquidity": liquidity,
            "growth": growth,
        },
        "scoring": {
            "profitability": profitability_score,
            "leverage": leverage_score,
            "liquidity": liquidity_score,
            "growth": growth_score,
            "overall": overall,
        },
        "memo": memo,
    }