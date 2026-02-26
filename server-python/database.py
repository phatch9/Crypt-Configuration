import os
from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as redis
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/drcrypt")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# MongoDB client
client = AsyncIOMotorClient(MONGO_URI)
db = client.get_default_database()

# Redis client
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

async def connect_db():
    try:
        await client.admin.command('ping')
        print("MongoDB Connected")
    except Exception as e:
        print(f"MongoDB Connection Error: {e}")

async def close_db():
    client.close()
    await redis_client.close()
