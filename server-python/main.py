from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from database import connect_db, close_db, redis_client
import asyncio
from routes_auth import router as auth_router
from routes_api import router as api_router
from binance_stream import connect_binance

app = FastAPI(title="Dr.Crypt API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(api_router, prefix="/api", tags=["api"])

# Background Tasks
binance_task = None

@app.on_event("startup")
async def startup_event():
    await connect_db()
    global binance_task
    binance_task = asyncio.create_task(connect_binance())

@app.on_event("shutdown")
async def shutdown_event():
    if binance_task:
        binance_task.cancel()
    await close_db()

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    symbol: str = Query(default="BTCUSDT")
):
    """
    Per-symbol WebSocket endpoint.
    Connect with: ws://localhost:8000/ws?symbol=ETHUSDT
    Falls back to the legacy root path for backward compat (handled below).
    """
    symbol = symbol.upper()
    await websocket.accept()
    print(f"Client connected — subscribing to {symbol}")

    pubsub = redis_client.pubsub()
    # Subscribe to the per-symbol Redis channel
    await pubsub.subscribe(f"price:{symbol}")

    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=0.1)
            if message and message["type"] == "message":
                await websocket.send_text(message["data"])
            await asyncio.sleep(0.01)
    except WebSocketDisconnect:
        print(f"Client disconnected from {symbol}")
    finally:
        await pubsub.unsubscribe(f"price:{symbol}")

# Root WebSocket kept for backward compatibility 
@app.websocket("/")
async def websocket_legacy(websocket: WebSocket):
    await websocket.accept()
    print("Client connected (legacy WS — BTCUSDT)")
    pubsub = redis_client.pubsub()
    await pubsub.subscribe("price:BTCUSDT")
    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=0.1)
            if message and message["type"] == "message":
                await websocket.send_text(message["data"])
            await asyncio.sleep(0.01)
    except WebSocketDisconnect:
        print("lient disconnected")
    finally:
        await pubsub.unsubscribe("price:BTCUSDT")
