from fastapi import FastAPI, WebSocket, WebSocketDisconnect
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
    # Start the binance stream in the background
    binance_task = asyncio.create_task(connect_binance())

@app.on_event("shutdown")
async def shutdown_event():
    if binance_task:
        binance_task.cancel()
    await close_db()

@app.websocket("/")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected to local WS (Python)")
    pubsub = redis_client.pubsub()
    await pubsub.subscribe("price_updates")
    
    try:
        while True:
            # We simultaneously listen to the websocket (for client disconnects) 
            # and to redis for messages to forward
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=0.1)
            if message and message['type'] == 'message':
                data = message['data']
                await websocket.send_text(data)
            
            # small sleep to yield control
            await asyncio.sleep(0.01)
    except WebSocketDisconnect:
        print("Client disconnected")
    finally:
        await pubsub.unsubscribe("price_updates")
