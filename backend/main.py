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
    }