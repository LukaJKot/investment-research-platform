from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import requests
from google import genai
import yfinance as yf

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://investment-research-platform-jade.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FMP_API_KEY = os.getenv("FMP_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

MARKETAUX_API_KEY = os.getenv("MARKETAUX_API_KEY")

@app.get("/test-news/{ticker}")
def test_news(ticker: str):
    return get_news_sentiment(ticker)
    
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

def get_income_statement_yfinance(ticker: str):
    stock = yf.Ticker(ticker)
    df = stock.financials
    if df.empty:
        return None, False

    import pandas as pd

    used_substitute = "Gross Profit" not in df.index or "EBIT" not in df.index

    years = []
    for col in df.columns:
        try:
            revenue = df.loc["Total Revenue", col]
            net_income = df.loc["Net Income", col]
        except KeyError:
            continue

        gross_profit = df.loc["Gross Profit", col] if "Gross Profit" in df.index else revenue
        ebit = df.loc["EBIT", col] if "EBIT" in df.index else (df.loc["Pretax Income", col] if "Pretax Income" in df.index else None)

        if pd.isna(revenue) or pd.isna(net_income) or pd.isna(gross_profit) or ebit is None or pd.isna(ebit):
            continue

        years.append({
            "fiscalYear": str(col.year),
            "revenue": float(revenue),
            "netIncome": float(net_income),
            "grossProfit": float(gross_profit),
            "ebit": float(ebit),
            "interestExpense": 0,
        })

    return (years if years else None), used_substitute

def get_balance_sheet_yfinance(ticker: str):
    stock = yf.Ticker(ticker)
    df = stock.balance_sheet
    if df.empty:
        return None

    import pandas as pd

    has_current_data = "Current Assets" in df.index and "Current Liabilities" in df.index

    years = []
    for col in df.columns:
        try:
            total_assets = df.loc["Total Assets", col]
            total_equity = df.loc["Stockholders Equity", col]
            total_debt = df.loc["Total Debt", col]
        except KeyError:
            continue

        current_assets = df.loc["Current Assets", col] if has_current_data else None
        current_liabilities = df.loc["Current Liabilities", col] if has_current_data else None
        inventory = df.loc["Inventory", col] if "Inventory" in df.index else 0

        if pd.isna(total_assets) or pd.isna(total_equity) or pd.isna(total_debt):
            continue

        years.append({
            "fiscalYear": str(col.year),
            "totalAssets": float(total_assets),
            "totalStockholdersEquity": float(total_equity),
            "totalCurrentAssets": float(current_assets) if current_assets is not None and not pd.isna(current_assets) else None,
            "totalCurrentLiabilities": float(current_liabilities) if current_liabilities is not None and not pd.isna(current_liabilities) else None,
            "totalDebt": float(total_debt),
            "inventory": float(inventory) if inventory and not pd.isna(inventory) else 0,
        })

    return years if years else None

def get_cash_flow_yfinance(ticker: str):
    stock = yf.Ticker(ticker)
    df = stock.cashflow
    if df.empty:
        return None
    return []            

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

    gross_margin = round(gross_profit / revenue, 4) if revenue != 0 else None
    net_margin = round(net_income / revenue, 4) if revenue != 0 else None
    roe = round(net_income / avg_equity, 4) if avg_equity != 0 else None
    roa = round(net_income / avg_assets, 4) if avg_assets != 0 else None

    return {
        "gross_margin": gross_margin,
        "net_margin": net_margin,
        "roe": roe,
        "roa": roa,
    }

def calculate_leverage_ratios(income_statement, balance_sheet):
    income = income_statement[0]
    balance = balance_sheet[0]

    total_debt = balance["totalDebt"]
    total_equity = balance["totalStockholdersEquity"]
    ebit = income["ebit"]
    interest_expense = income["interestExpense"]

    debt_to_equity = round(total_debt / total_equity, 4) if total_equity != 0 else None
    interest_coverage = round(ebit / interest_expense, 4) if interest_expense != 0 else None

    return {
        "debt_to_equity": debt_to_equity,
        "interest_coverage": interest_coverage,
    }

def calculate_liquidity_ratios(balance_sheet):
    balance = balance_sheet[0]

    current_assets = balance["totalCurrentAssets"]
    current_liabilities = balance["totalCurrentLiabilities"]
    inventory = balance["inventory"]

    if current_assets is None or current_liabilities is None or current_liabilities == 0:
        return {"current_ratio": None, "quick_ratio": None}

    current_ratio = round(current_assets / current_liabilities, 4)
    quick_ratio = round((current_assets - inventory) / current_liabilities, 4)

    return {
        "current_ratio": current_ratio,
        "quick_ratio": quick_ratio,
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
        revenue = year_data["revenue"]
        gross_margin = round(year_data["grossProfit"] / revenue, 4) if revenue != 0 else None

        trends.append({
            "fiscal_year": year_data["fiscalYear"],
            "revenue": revenue,
            "net_income": year_data["netIncome"],
            "gross_margin": gross_margin,
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

def get_news_articles(ticker: str):
    url = f"https://api.marketaux.com/v1/news/all?symbols={ticker}&filter_entities=true&language=en&limit=15&api_token={MARKETAUX_API_KEY}"
    try:
        response = requests.get(url)
        data = response.json()
    except ValueError:
        return []

    if "data" not in data:
        return []

    articles = []
    for article in data["data"]:
        entity = next((e for e in article["entities"] if e["symbol"] == ticker), None)
        if entity is None or entity["match_score"] < 20:
            continue
        articles.append({
            "title": article["title"],
            "description": article["description"],
            "url": article["url"],
            "source": article["source"],
        })
    return articles       

import json
import time

def generate_research_memo(ticker, ratios, scoring, trends, peer_comparison, articles):
    articles_text = "\n".join(
        [f'- "{a["title"]}" ({a["source"]}, URL: {a["url"]}): {a["description"]}' for a in articles]
    ) if articles else "No recent news articles available."

    prompt = f"""You are a financial writing assistant. You will be given pre-calculated financial data for {ticker}, plus recent news headlines. Respond ONLY with valid JSON — no markdown formatting, no code fences, no preamble text.

STRICT RULES:
- Do NOT calculate any new numbers or ratios.
- Do NOT contradict, second-guess, or override the given overall rating or category scores.
- Do NOT give personal investment advice or say whether someone should buy/sell.
- Only reference the data and articles provided below. Do not invent facts.
- For bullish_themes and bearish_themes: judge each headline by what it actually argues, not just its tone. An article using positive language but concluding "Sell" is bearish, not bullish.
- Keep the memo to 3-4 short paragraphs. Keep each theme to 1-2 sentences.
- For each theme in bullish_themes and bearish_themes, include the EXACT url from the article it came from, copied precisely from the URL given above. Do not modify or shorten URLs.

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

RECENT NEWS:
{articles_text}

Respond with exactly this JSON structure:
{{
  "memo": "3-4 paragraph research memo as a single string",
  "bullish_themes": [{{"theme": "1-2 sentence summary", "source": "source name", "url": "exact article URL"}}],
  "bearish_themes": [{{"theme": "1-2 sentence summary", "source": "source name", "url": "exact article URL"}}]
}}"""

    models_to_try = ["gemini-3.5-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"]

    for attempt, model_name in enumerate(models_to_try):
        try:
            response = gemini_client.models.generate_content(
                model=model_name,
                contents=prompt,
            )
            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return json.loads(text)
        except Exception:
            if attempt < len(models_to_try) - 1:
                time.sleep(3 + attempt * 2)
                continue
            return {
                "memo": "The AI research memo and sentiment analysis are temporarily unavailable due to high demand on our AI provider's servers. All scores and ratios above are unaffected and fully accurate — please try refreshing in a moment.",
                "bullish_themes": [],
                "bearish_themes": [],
            }

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
    data_source = "FMP"

    if income is None or balance_sheet is None or cash_flow is None:
        income, used_substitute = get_income_statement_yfinance(ticker)
        balance_sheet = get_balance_sheet_yfinance(ticker)
        cash_flow = get_cash_flow_yfinance(ticker)
        data_source = "Yahoo Finance"
    else:
        used_substitute = False

    if income is None or balance_sheet is None or cash_flow is None:
        return {"error": f"No data available for ticker '{ticker}'. It may not be covered by our data providers."}
        
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
    articles = get_news_articles(ticker)
    ai_result = generate_research_memo(ticker, {"profitability": profitability, "leverage": leverage, "liquidity": liquidity, "growth": growth}, {"overall": overall, "profitability": profitability_score, "leverage": leverage_score, "liquidity": liquidity_score, "growth": growth_score}, trends, peer_comparison, articles)


    return {
        "ticker": ticker,
        "data_source": data_source,
        "data_notes": ["Gross margin and EBIT-based figures use revenue/pretax income as substitutes, since this company's financial statements don't report them separately (common for financial institutions)."] if used_substitute else [],

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
        "memo": ai_result.get("memo"),
        "bullish_themes": ai_result.get("bullish_themes", []),
        "bearish_themes": ai_result.get("bearish_themes", []),
    }