from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import requests

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FMP_API_KEY = os.getenv("FMP_API_KEY")

def get_income_statement(ticker: str):
    url = f"https://financialmodelingprep.com/stable/income-statement?symbol={ticker}&limit=5&apikey={FMP_API_KEY}"
    response = requests.get(url)
    return response.json()

def get_balance_sheet(ticker: str):
    url = f"https://financialmodelingprep.com/stable/balance-sheet-statement?symbol={ticker}&limit=5&apikey={FMP_API_KEY}"
    response = requests.get(url)
    return response.json()

def get_cash_flow(ticker: str):
    url = f"https://financialmodelingprep.com/stable/cash-flow-statement?symbol={ticker}&limit=5&apikey={FMP_API_KEY}"
    response = requests.get(url)
    return response.json()

def calculate_profitability_ratios(income_statement, balance_sheet):
    income = income_statement[0]
    balance_current = balance_sheet[0]
    balance_previous = balance_sheet[1]

    revenue = income["revenue"]
    net_income = income["netIncome"]
    gross_profit = income["grossProfit"]

    avg_equity = (balance_current["totalStockholdersEquity"] + balance_previous["totalStockholdersEquity"]) / 2
    avg_assets = (balance_current["totalAssets"] + balance_previous["totalAssets"]) / 2

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
@app.get("/")
def read_root():
    return {"message": "Hello from your backend!"}

@app.get("/stock/{ticker}")
def get_stock(ticker: str):
    income = get_income_statement(ticker)
    balance_sheet = get_balance_sheet(ticker)
    cash_flow = get_cash_flow(ticker)
    profitability = calculate_profitability_ratios(income, balance_sheet)
    leverage = calculate_leverage_ratios(income, balance_sheet)
    liquidity = calculate_liquidity_ratios(balance_sheet)
    growth = calculate_growth_ratios(income)

    profitability_score = score_profitability(profitability)
    leverage_score = score_leverage(leverage)
    liquidity_score = score_liquidity(liquidity)

    return {
        "ticker": ticker,
        "income_statement": income,
        "balance_sheet": balance_sheet,
        "cash_flow": cash_flow,
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
        },
    }