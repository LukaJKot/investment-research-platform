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
    url = f"https://financialmodelingprep.com/stable/income-statement?symbol={ticker}&limit=1&apikey={FMP_API_KEY}"
    response = requests.get(url)
    return response.json()

@app.get("/")
def read_root():
    return {"message": "Hello from your backend!"}

@app.get("/stock/{ticker}")
def get_stock(ticker: str):
    data = get_income_statement(ticker)
    return data
