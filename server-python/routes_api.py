from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from models import Trade, PyObjectId
from database import db, redis_client
from auth_utils import SECRET_KEY, ALGORITHM
from datetime import datetime
from bson import ObjectId

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# ── Supported coins metadata ──────────────────────────────────────────────────
SUPPORTED_COINS = [
    {"symbol": "BTCUSDT",  "name": "Bitcoin",   "base": "BTC",  "iconSlug": "bitcoin"},
    {"symbol": "ETHUSDT",  "name": "Ethereum",  "base": "ETH",  "iconSlug": "ethereum"},
    {"symbol": "SOLUSDT",  "name": "Solana",    "base": "SOL",  "iconSlug": "solana"},
    {"symbol": "BNBUSDT",  "name": "BNB",       "base": "BNB",  "iconSlug": "bnb"},
    {"symbol": "ADAUSDT",  "name": "Cardano",   "base": "ADA",  "iconSlug": "cardano"},
    {"symbol": "XRPUSDT",  "name": "XRP",       "base": "XRP",  "iconSlug": "xrp"},
    {"symbol": "DOGEUSDT", "name": "Dogecoin",  "base": "DOGE", "iconSlug": "dogecoin"},
    {"symbol": "SHIBUSDT", "name": "Shiba Inu", "base": "SHIB", "iconSlug": "shiba-inu"},
]

# ── Auth helper ───────────────────────────────────────────────────────────────

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: str = payload.get("id")
        if username is None or user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"username": username, "id": user_id}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ── Coins endpoints ───────────────────────────────────────────────────────────

@router.get("/coins")
async def get_coins():
    """Return all supported coins with their latest cached prices from Redis."""
    result = []
    for coin in SUPPORTED_COINS:
        raw = await redis_client.get(f"price:{coin['symbol']}")
        price = float(raw) if raw else None
        result.append({**coin, "price": price})
    return result

@router.get("/prices/current")
async def get_current_price(symbol: str = "BTCUSDT"):
    """Return the latest cached price for a single symbol."""
    symbol = symbol.upper()
    raw = await redis_client.get(f"price:{symbol}")
    if raw is None:
        raise HTTPException(status_code=404, detail=f"No price data for {symbol}")
    return {"symbol": symbol, "price": float(raw)}

# ── Price history ─────────────────────────────────────────────────────────────

@router.get("/prices/history")
async def get_historical_prices(symbol: str = "BTCUSDT", limit: int = 100):
    prices_cursor = db.prices.find({"symbol": symbol.upper()}).sort("timestamp", -1).limit(limit)
    prices = await prices_cursor.to_list(length=limit)

    result = []
    for p in prices:
        result.append({
            "symbol": p["symbol"],
            "price": p["price"],
            "timestamp": p["timestamp"].isoformat()
        })
    return result

# ── Trade endpoints ───────────────────────────────────────────────────────────

@router.post("/trade")
async def execute_trade(trade: Trade, current_user: dict = Depends(get_current_user)):
    trade_dict = trade.model_dump(by_alias=True, exclude={"id"})
    trade_dict["user"] = ObjectId(current_user["id"])
    trade_dict["timestamp"] = datetime.utcnow()

    new_trade = await db.trades.insert_one(trade_dict)
    return {"message": "Trade executed", "trade_id": str(new_trade.inserted_id)}

@router.get("/trade")
async def get_trades(current_user: dict = Depends(get_current_user)):
    trades_cursor = db.trades.find({"user": ObjectId(current_user["id"])}).sort("timestamp", -1)
    trades = await trades_cursor.to_list(length=100)

    for t in trades:
        t["_id"] = str(t["_id"])
        t["user"] = str(t["user"])
        t["timestamp"] = t["timestamp"].isoformat()

    return trades
