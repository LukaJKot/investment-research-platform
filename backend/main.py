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

@app.get("/")
def read_root():
    return {"message": "Hello from your backend!"}

@app.get("/stock/{ticker}")
def get_stock(ticker: str):
    income = get_income_statement(ticker)
    balance_sheet = get_balance_sheet(ticker)
    cash_flow = get_cash_flow(ticker)
    profitability = calculate_profitability_ratios(income, balance_sheet)

    return {
        "ticker": ticker,
        "income_statement": income,
        "balance_sheet": balance_sheet,
        "cash_flow": cash_flow,
        "ratios": {
            "profitability": profitability,
        },
    }