from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    timezone: str = "UTC"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    timezone: str = "UTC"

class EventStatus(BaseModel):
    BUSY: str = "BUSY"
    SWAPPABLE: str = "SWAPPABLE"
    SWAP_PENDING: str = "SWAP_PENDING"

class EventCreate(BaseModel):
    title: str
    start_time: str  # ISO format timestamp
    end_time: str    # ISO format timestamp
    status: str = "BUSY"

class EventUpdate(BaseModel):
    title: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: Optional[str] = None

class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    start_time: str
    end_time: str
    status: str = "BUSY"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SwapRequestCreate(BaseModel):
    my_slot_id: str
    their_slot_id: str

class SwapResponse(BaseModel):
    accepted: bool

class SwapRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    requester_id: str
    requester_slot_id: str
    target_slot_id: str
    target_user_id: str
    status: str = "PENDING"  # PENDING, ACCEPTED, REJECTED
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Helper Functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Auth Routes
@api_router.post("/auth/signup")
async def signup(user_data: UserSignup):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = User(
        name=user_data.name,
        email=user_data.email,
        timezone=user_data.timezone
    )
    user_dict = user.model_dump()
    user_dict["password_hash"] = hash_password(user_data.password)
    
    await db.users.insert_one(user_dict)
    
    # Create JWT token
    token = create_access_token({"user_id": user.id, "email": user.email})
    
    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "timezone": user.timezone
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    # Find user
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create JWT token
    token = create_access_token({"user_id": user["id"], "email": user["email"]})
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "timezone": user["timezone"]
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "timezone": current_user["timezone"]
    }

# Event Routes
@api_router.get("/events", response_model=List[Event])
async def get_events(current_user: dict = Depends(get_current_user)):
    events = await db.events.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    return events

@api_router.post("/events", response_model=Event)
async def create_event(event_data: EventCreate, current_user: dict = Depends(get_current_user)):
    event = Event(
        user_id=current_user["id"],
        title=event_data.title,
        start_time=event_data.start_time,
        end_time=event_data.end_time,
        status=event_data.status
    )
    event_dict = event.model_dump()
    await db.events.insert_one(event_dict)
    return event

@api_router.put("/events/{event_id}", response_model=Event)
async def update_event(
    event_id: str,
    event_data: EventUpdate,
    current_user: dict = Depends(get_current_user)
):
    # Find event and verify ownership
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Update fields
    update_data = {k: v for k, v in event_data.model_dump().items() if v is not None}
    if update_data:
        await db.events.update_one({"id": event_id}, {"$set": update_data})
    
    # Fetch updated event
    updated_event = await db.events.find_one({"id": event_id}, {"_id": 0})
    return updated_event

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.events.delete_one({"id": event_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}

# Swap Routes
@api_router.get("/swappable-slots")
async def get_swappable_slots(current_user: dict = Depends(get_current_user)):
    # Get all swappable slots from other users
    slots = await db.events.find({
        "status": "SWAPPABLE",
        "user_id": {"$ne": current_user["id"]}
    }, {"_id": 0}).to_list(1000)
    
    # Enrich with user information
    for slot in slots:
        user = await db.users.find_one({"id": slot["user_id"]}, {"_id": 0, "password_hash": 0})
        if user:
            slot["user_name"] = user["name"]
            slot["user_email"] = user["email"]
    
    return slots

@api_router.post("/swap-request")
async def create_swap_request(
    swap_data: SwapRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    # Verify both slots exist
    my_slot = await db.events.find_one({"id": swap_data.my_slot_id, "user_id": current_user["id"]})
    if not my_slot:
        raise HTTPException(status_code=404, detail="Your slot not found")
    
    their_slot = await db.events.find_one({"id": swap_data.their_slot_id})
    if not their_slot:
        raise HTTPException(status_code=404, detail="Target slot not found")
    
    # Verify both slots are SWAPPABLE
    if my_slot["status"] != "SWAPPABLE":
        raise HTTPException(status_code=400, detail="Your slot is not swappable")
    
    if their_slot["status"] != "SWAPPABLE":
        raise HTTPException(status_code=400, detail="Target slot is not swappable")
    
    # Create swap request
    swap_request = SwapRequest(
        requester_id=current_user["id"],
        requester_slot_id=swap_data.my_slot_id,
        target_slot_id=swap_data.their_slot_id,
        target_user_id=their_slot["user_id"]
    )
    swap_dict = swap_request.model_dump()
    await db.swap_requests.insert_one(swap_dict)
    
    # Update both slots to SWAP_PENDING
    await db.events.update_one({"id": swap_data.my_slot_id}, {"$set": {"status": "SWAP_PENDING"}})
    await db.events.update_one({"id": swap_data.their_slot_id}, {"$set": {"status": "SWAP_PENDING"}})
    
    return swap_request

@api_router.post("/swap-response/{request_id}")
async def respond_to_swap(
    request_id: str,
    response: SwapResponse,
    current_user: dict = Depends(get_current_user)
):
    # Find swap request
    swap_request = await db.swap_requests.find_one({"id": request_id})
    if not swap_request:
        raise HTTPException(status_code=404, detail="Swap request not found")
    
    # Verify user is the target
    if swap_request["target_user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to respond to this request")
    
    # Verify request is still pending
    if swap_request["status"] != "PENDING":
        raise HTTPException(status_code=400, detail="Request has already been processed")
    
    if response.accepted:
        # ACCEPT: Exchange slot ownership
        requester_slot = await db.events.find_one({"id": swap_request["requester_slot_id"]})
        target_slot = await db.events.find_one({"id": swap_request["target_slot_id"]})
        
        if not requester_slot or not target_slot:
            raise HTTPException(status_code=404, detail="One or both slots not found")
        
        # Swap the user_id fields
        await db.events.update_one(
            {"id": swap_request["requester_slot_id"]},
            {"$set": {"user_id": target_slot["user_id"], "status": "BUSY"}}
        )
        await db.events.update_one(
            {"id": swap_request["target_slot_id"]},
            {"$set": {"user_id": requester_slot["user_id"], "status": "BUSY"}}
        )
        
        # Update swap request status
        await db.swap_requests.update_one(
            {"id": request_id},
            {"$set": {"status": "ACCEPTED"}}
        )
        
        return {"message": "Swap accepted successfully", "status": "ACCEPTED"}
    else:
        # REJECT: Set slots back to SWAPPABLE
        await db.events.update_one(
            {"id": swap_request["requester_slot_id"]},
            {"$set": {"status": "SWAPPABLE"}}
        )
        await db.events.update_one(
            {"id": swap_request["target_slot_id"]},
            {"$set": {"status": "SWAPPABLE"}}
        )
        
        # Update swap request status
        await db.swap_requests.update_one(
            {"id": request_id},
            {"$set": {"status": "REJECTED"}}
        )
        
        return {"message": "Swap rejected", "status": "REJECTED"}

@api_router.get("/swap-requests/incoming")
async def get_incoming_swap_requests(current_user: dict = Depends(get_current_user)):
    requests = await db.swap_requests.find({
        "target_user_id": current_user["id"],
        "status": "PENDING"
    }, {"_id": 0}).to_list(1000)
    
    # Enrich with slot and user information
    for req in requests:
        requester = await db.users.find_one({"id": req["requester_id"]}, {"_id": 0, "password_hash": 0})
        requester_slot = await db.events.find_one({"id": req["requester_slot_id"]}, {"_id": 0})
        target_slot = await db.events.find_one({"id": req["target_slot_id"]}, {"_id": 0})
        
        if requester:
            req["requester_name"] = requester["name"]
            req["requester_email"] = requester["email"]
        if requester_slot:
            req["requester_slot"] = requester_slot
        if target_slot:
            req["target_slot"] = target_slot
    
    return requests

@api_router.get("/swap-requests/outgoing")
async def get_outgoing_swap_requests(current_user: dict = Depends(get_current_user)):
    requests = await db.swap_requests.find({
        "requester_id": current_user["id"]
    }, {"_id": 0}).to_list(1000)
    
    # Enrich with slot and user information
    for req in requests:
        target_user = await db.users.find_one({"id": req["target_user_id"]}, {"_id": 0, "password_hash": 0})
        requester_slot = await db.events.find_one({"id": req["requester_slot_id"]}, {"_id": 0})
        target_slot = await db.events.find_one({"id": req["target_slot_id"]}, {"_id": 0})
        
        if target_user:
            req["target_user_name"] = target_user["name"]
            req["target_user_email"] = target_user["email"]
        if requester_slot:
            req["requester_slot"] = requester_slot
        if target_slot:
            req["target_slot"] = target_slot
    
    return requests

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
