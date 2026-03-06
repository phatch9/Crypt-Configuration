from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from database import db
from auth_utils import get_password_hash, verify_password, create_access_token
from models import User
from datetime import timedelta

router = APIRouter()

class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/register", response_model=Token)
async def register(user: UserCreate):
    existing_user = await db.users.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = await db.users.insert_one({"username": user.username, "password": hashed_password})
    
    access_token = create_access_token(
        data={"sub": user.username, "id": str(new_user.inserted_id)}, 
        expires_delta=timedelta(days=30)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(user: UserCreate):
    db_user = await db.users.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    access_token = create_access_token(
        data={"sub": user.username, "id": str(db_user["_id"])},
        expires_delta=timedelta(days=30)
    )
    return {"access_token": access_token, "token_type": "bearer"}
