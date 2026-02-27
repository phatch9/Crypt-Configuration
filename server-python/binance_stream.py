import asyncio
import json
import websockets
from datetime import datetime
from database import redis_client, db

# Supported coins - Binance .US combined stream
SUPPORTED_SYMBOLS = [
    "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT",
    "ADAUSDT", "XRPUSDT", "DOGEUSDT", "SHIBUSDT",
]

def _build_stream_url() -> str:
    streams = "/".join(f"{s.lower()}@trade" for s in SUPPORTED_SYMBOLS)
    return f"wss://stream.binance.us:9443/stream?streams={streams}"

async def connect_binance():
    url = _build_stream_url()
    while True:
        try:
            async with websockets.connect(url) as ws:
                print(f"Connected to Binance combined stream ({len(SUPPORTED_SYMBOLS)} symbols)")
                async for raw in ws:
                    try:
                        envelope = json.loads(raw)
                        # Combined stream wraps trade data under "data"
                        trade = envelope.get("data", envelope)
                        price = float(trade["p"])
                        symbol = trade["s"]            # e.g. "ETHUSDT"
                        timestamp = datetime.fromtimestamp(trade["T"] / 1000.0)

                        # Cache latest price in Redis (per-symbol key)
                        await redis_client.set(f"price:{symbol}", price)

                        # Publish to a per-symbol channel so WebSocket clients can subscribe selectively
                        payload = json.dumps({
                            "symbol": symbol,
                            "price": price,
                            "timestamp": timestamp.isoformat()
                        })
                        await redis_client.publish(f"price:{symbol}", payload)
                        # Also publish to the catch-all channel for backward compatibility
                        await redis_client.publish("price_updates", payload)

                        # Persist to MongoDB (throttle: only every ~10 trades to reduce write load)
                        if int(trade["t"]) % 10 == 0:
                            await db.prices.insert_one({
                                "symbol": symbol,
                                "price": price,
                                "timestamp": timestamp
                            })
                    except Exception as e:
                        print(f"Error processing Binance message: {e}")
        except websockets.exceptions.ConnectionClosed:
            print("Binance Connection Closed. Reconnecting in 5s…")
            await asyncio.sleep(5)
        except Exception as e:
            print(f"Binance WS Error: {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(connect_binance())
