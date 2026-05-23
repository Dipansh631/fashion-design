from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session, select, create_engine
from models import User, UserDesign, Product, Follow, Comment
from typing import List, Optional
from pydantic import BaseModel

class CheckGoogleRequest(BaseModel):
    google_id: str

class CheckPhoneRequest(BaseModel):
    mobile_no: str

class RegisterRequest(BaseModel):
    username: str
    mobile_no: Optional[str] = None
    email: Optional[str] = None
    google_id: Optional[str] = None
    bio: Optional[str] = None
    profile_pic: Optional[str] = None

app = FastAPI(title="Vogue Artisan API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

import os

# Safe local parser for parent .env configurations
def load_dotenv():
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(parent_dir, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()

load_dotenv()

# Select Database URL: Remote PostgreSQL Supabase cluster if filled, otherwise local SQLite
database_url = os.environ.get("DATABASE_URL")
if database_url and database_url.startswith("postgresql") and "[YOUR-PASSWORD]" not in database_url:
    print("Connecting to Supabase PostgreSQL cluster...")
    engine = create_engine(database_url)
else:
    print("Falling back to local SQLite database (fashion_app.db)...")
    sqlite_file_name = "fashion_app.db"
    sqlite_url = f"sqlite:///{sqlite_file_name}"
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def run_migrations():
    from sqlalchemy import text
    try:
        with Session(engine) as session:
            try:
                session.execute(text('ALTER TABLE "userdesign" ADD COLUMN is_ready_to_sell BOOLEAN DEFAULT FALSE;'))
                session.commit()
            except Exception:
                session.rollback()
            try:
                session.execute(text('ALTER TABLE "userdesign" ADD COLUMN price DOUBLE PRECISION DEFAULT 0.0;'))
                session.commit()
            except Exception:
                session.rollback()
            try:
                session.execute(text('ALTER TABLE "user" ADD COLUMN profile_views INTEGER DEFAULT 0;'))
                session.commit()
                print("Migration: Added profile_views to user")
            except Exception:
                session.rollback()
            try:
                session.execute(text("ALTER TABLE \"userdesign\" ADD COLUMN category VARCHAR(255) DEFAULT 'Couture';"))
                session.commit()
                print("Migration: Added category to userdesign")
            except Exception:
                session.rollback()
    except Exception as e:
        print("Self-healing database migration warning:", e)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    run_migrations()
    # Seed database with premium fashion profiles and products
    with Session(engine) as session:
        user_count = session.exec(select(User)).first()
        if not user_count:
            print("Seeding database with premium fashion profiles...")
            neo = User(
                username="NeoTokyo",
                bio="Pioneering cyberpunk streetwear and neo-traditional fusion from Tokyo. Verified partner.",
                profile_pic="https://api.dicebear.com/7.x/adventurer/svg?seed=NeoTokyo",
                is_verified_business=True
            )
            aurora = User(
                username="Aurora",
                bio="Ethereal garments, high-fashion runway gowns, and organic flowy textures.",
                profile_pic="https://api.dicebear.com/7.x/adventurer/svg?seed=Aurora",
                is_verified_business=True
            )
            glitch = User(
                username="Glitch",
                bio="Deconstructed sportswear, technical fabrics, and agentic algorithmic silhouettes.",
                profile_pic="https://api.dicebear.com/7.x/adventurer/svg?seed=Glitch",
                is_verified_business=True
            )
            session.add(neo)
            session.add(aurora)
            session.add(glitch)
            session.commit()
            session.refresh(neo)
            session.refresh(aurora)
            session.refresh(glitch)

            designs = [
                UserDesign(
                    title="Cyberpunk Kimono",
                    description="Fusion of traditional kimono cuts with waterproof, neon-laced high-performance techwear fabrics.",
                    image_url="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop",
                    is_ai_generated=True,
                    likes=1240,
                    creator_id=neo.id
                ),
                UserDesign(
                    title="Ethereal Gown",
                    description="Bespoke silk chiffon gown with delicate gradient hues, mirroring the northern lights in movement.",
                    image_url="https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=600&auto=format&fit=crop",
                    is_ai_generated=False,
                    likes=890,
                    creator_id=aurora.id
                ),
                UserDesign(
                    title="Techwear Pulse Jacket",
                    description="An urban exploration coat equipped with active heating elements and reflective asymmetric paneling.",
                    image_url="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=600&auto=format&fit=crop",
                    is_ai_generated=True,
                    likes=2100,
                    creator_id=glitch.id
                ),
                UserDesign(
                    title="Obsidian Duster",
                    description="A sweeping, matte black duster made from durable ripstop nylon, optimized for modular attachments.",
                    image_url="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
                    is_ai_generated=False,
                    likes=450,
                    creator_id=glitch.id
                )
            ]
            for d in designs:
                session.add(d)
            session.commit()

        product_count = session.exec(select(Product)).first()
        if not product_count:
            print("Seeding database with premium products...")
            products = [
                Product(
                    name="Obsidian Jacket",
                    price=299.00,
                    stock_count=5,
                    category="Outerwear",
                    image_url="https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop",
                    is_trending=True
                ),
                Product(
                    name="Neon Sash",
                    price=85.00,
                    stock_count=12,
                    category="Accessories",
                    image_url="https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop",
                    is_trending=True
                ),
                Product(
                    name="Void Boots",
                    price=150.00,
                    stock_count=3,
                    category="Footwear",
                    image_url="https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=600&auto=format&fit=crop",
                    is_trending=True
                )
            ]
            for p in products:
                session.add(p)
            session.commit()

def get_session():
    with Session(engine) as session:
        yield session

@app.get("/trending-designs")
def get_trending_designs(session: Session = Depends(get_session)):
    statement = select(UserDesign, User.username).join(User, UserDesign.creator_id == User.id).order_by(UserDesign.likes.desc()).limit(10)
    results = session.exec(statement).all()
    return [
        {
            "id": design.id,
            "title": design.title,
            "description": design.description,
            "image_url": design.image_url,
            "is_ai_generated": design.is_ai_generated,
            "likes": design.likes,
            "creator_id": design.creator_id,
            "created_at": design.created_at,
            "is_ready_to_sell": design.is_ready_to_sell,
            "price": design.price,
            "creator_username": username
        }
        for design, username in results
    ]

@app.get("/designs")
def get_all_designs(session: Session = Depends(get_session)):
    statement = select(UserDesign, User.username).join(User, UserDesign.creator_id == User.id).where(UserDesign.is_ready_to_sell == False).order_by(UserDesign.created_at.desc())
    results = session.exec(statement).all()
    return [
        {
            "id": design.id,
            "title": design.title,
            "description": design.description,
            "image_url": design.image_url,
            "is_ai_generated": design.is_ai_generated,
            "likes": design.likes,
            "creator_id": design.creator_id,
            "created_at": design.created_at,
            "is_ready_to_sell": design.is_ready_to_sell,
            "price": design.price,
            "creator_username": username
        }
        for design, username in results
    ]

@app.get("/designs/market")
def get_market_designs(session: Session = Depends(get_session)):
    statement = select(UserDesign, User.username).join(User, UserDesign.creator_id == User.id).where(UserDesign.is_ready_to_sell == True).order_by(UserDesign.created_at.desc())
    results = session.exec(statement).all()
    return [
        {
            "id": design.id,
            "title": design.title,
            "description": design.description,
            "image_url": design.image_url,
            "is_ai_generated": design.is_ai_generated,
            "likes": design.likes,
            "creator_id": design.creator_id,
            "created_at": design.created_at,
            "is_ready_to_sell": design.is_ready_to_sell,
            "price": design.price,
            "creator_username": username
        }
        for design, username in results
    ]


@app.get("/in-stock-items", response_model=List[Product])
def get_in_stock_items(session: Session = Depends(get_session)):
    statement = select(Product).where(Product.stock_count > 0)
    return session.exec(statement).all()

@app.get("/users/leaderboard")
def get_designer_leaderboard(session: Session = Depends(get_session)):
    statement = select(User)
    users = session.exec(statement).all()
    leaderboard = []
    for u in users:
        f_statement = select(Follow).where(Follow.followed_username == u.username)
        followers = session.exec(f_statement).all()
        leaderboard.append({
            "username": u.username,
            "profile_pic": u.profile_pic,
            "bio": u.bio,
            "followers_count": len(followers),
            "profile_views": u.profile_views or 0,
            "is_verified_business": u.is_verified_business
        })
    leaderboard.sort(key=lambda x: (x["followers_count"], x["profile_views"]), reverse=True)
    return leaderboard[:10]

@app.get("/users/{username}", response_model=User)
def get_user_profile(username: str, session: Session = Depends(get_session)):
    statement = select(User).where(User.username == username)
    user = session.exec(statement).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/users/{username}/designs", response_model=List[UserDesign])
def get_user_designs(username: str, session: Session = Depends(get_session)):
    statement = select(User).where(User.username == username)
    user = session.exec(statement).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    design_statement = select(UserDesign).where(UserDesign.creator_id == user.id)
    return session.exec(design_statement).all()

@app.post("/designs/", response_model=UserDesign)
def create_design(design: UserDesign, session: Session = Depends(get_session)):
    session.add(design)
    session.commit()
    session.refresh(design)
    return design

@app.delete("/designs/{design_id}")
def delete_design(design_id: int, requester_id: int, session: Session = Depends(get_session)):
    design = session.get(UserDesign, design_id)
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    if design.creator_id != requester_id:
        raise HTTPException(status_code=403, detail="You can only delete your own designs")
    # Also delete related comments/likes
    comment_statement = select(Comment).where(Comment.design_id == design_id)
    comments = session.exec(comment_statement).all()
    for c in comments:
        session.delete(c)
    session.delete(design)
    session.commit()
    return {"message": "Design deleted successfully", "design_id": design_id}

@app.post("/verify-business")
def verify_business_request(user_id: int, mobile_no: str):
    # This will be integrated with the Flask verification service
    return {"status": "pending", "message": "Verification request sent to internal service"}

@app.post("/auth/check-google")
def check_google(req: CheckGoogleRequest, session: Session = Depends(get_session)):
    statement = select(User).where(User.google_id == req.google_id)
    user = session.exec(statement).first()
    if user:
        return {
            "exists": True,
            "user": user,
            "phone_verified": user.mobile_no is not None
        }
    return {
        "exists": False,
        "user": None,
        "phone_verified": False
    }

@app.post("/auth/check-phone")
def check_phone(req: CheckPhoneRequest, session: Session = Depends(get_session)):
    statement = select(User).where(User.mobile_no == req.mobile_no)
    user = session.exec(statement).first()
    if user:
        return {
            "exists": True,
            "user": user
        }
    return {
        "exists": False,
        "user": None
    }

@app.post("/auth/register")
def register_user(req: RegisterRequest, session: Session = Depends(get_session)):
    # Enforce maximum of 20 characters for username
    if not req.username or len(req.username.strip()) > 20:
        raise HTTPException(status_code=400, detail="Username must not exceed 20 characters")
        
    # Check if username exists
    statement = select(User).where(User.username == req.username)
    if session.exec(statement).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Check if phone exists if provided
    if req.mobile_no:
        statement = select(User).where(User.mobile_no == req.mobile_no)
        if session.exec(statement).first():
            raise HTTPException(status_code=400, detail="Phone number already registered")
        
    # Check if google_id exists if provided
    if req.google_id:
        statement = select(User).where(User.google_id == req.google_id)
        if session.exec(statement).first():
            raise HTTPException(status_code=400, detail="Google account already registered")
            
    # Check if email exists if provided
    if req.email:
        statement = select(User).where(User.email == req.email)
        if session.exec(statement).first():
            raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        username=req.username,
        mobile_no=req.mobile_no,
        email=req.email,
        google_id=req.google_id,
        bio=req.bio or "",
        profile_pic=req.profile_pic or f"https://api.dicebear.com/7.x/adventurer/svg?seed={req.username}",
        is_verified_business=False
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return {
        "status": "success",
        "user": user
    }

class UpdateProfilePicRequest(BaseModel):
    profile_pic: str

@app.put("/users/{username}/profile-pic")
def update_profile_pic(username: str, req: UpdateProfilePicRequest, session: Session = Depends(get_session)):
    statement = select(User).where(User.username == username)
    user = session.exec(statement).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.profile_pic = req.profile_pic
    session.add(user)
    session.commit()
    session.refresh(user)
    return {
        "status": "success",
        "profile_pic": user.profile_pic
    }

class UpdateProfileRequest(BaseModel):
    username: str
    bio: Optional[str] = None
    profile_pic: Optional[str] = None

@app.put("/users/{username}/profile")
def update_profile(username: str, req: UpdateProfileRequest, session: Session = Depends(get_session)):
    new_username = req.username.strip()
    if not new_username:
        raise HTTPException(status_code=400, detail="Username cannot be empty")
    if len(new_username) > 20:
        raise HTTPException(status_code=400, detail="Username must not exceed 20 characters")
        
    statement = select(User).where(User.username == username)
    user = session.exec(statement).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if new_username != username:
        taken_stmt = select(User).where(User.username == new_username)
        if session.exec(taken_stmt).first():
            raise HTTPException(status_code=400, detail="Username already taken")
            
        # Update follower connections
        follows_follower = session.exec(select(Follow).where(Follow.follower_username == username)).all()
        for f in follows_follower:
            f.follower_username = new_username
            session.add(f)
            
        # Update followed connections
        follows_followed = session.exec(select(Follow).where(Follow.followed_username == username)).all()
        for f in follows_followed:
            f.followed_username = new_username
            session.add(f)
            
        # Update comments
        comments = session.exec(select(Comment).where(Comment.username == username)).all()
        for c in comments:
            c.username = new_username
            session.add(c)
            
    user.username = new_username
    user.bio = req.bio or ""
    if req.profile_pic:
        user.profile_pic = req.profile_pic
        
    session.add(user)
    session.commit()
    session.refresh(user)
    return {
        "status": "success",
        "user": user
    }
class FollowToggleRequest(BaseModel):
    follower_username: str

@app.post("/users/{username}/follow")
def toggle_follow(username: str, req: FollowToggleRequest, session: Session = Depends(get_session)):
    statement = select(Follow).where(
        Follow.follower_username == req.follower_username,
        Follow.followed_username == username
    )
    existing = session.exec(statement).first()
    if existing:
        session.delete(existing)
        session.commit()
        return {"status": "success", "action": "unfollowed"}
    else:
        follow = Follow(follower_username=req.follower_username, followed_username=username)
        session.add(follow)
        session.commit()
        return {"status": "success", "action": "followed"}

@app.get("/users/{username}/following")
def get_following(username: str, session: Session = Depends(get_session)):
    statement = select(Follow).where(Follow.follower_username == username)
    results = session.exec(statement).all()
    return [f.followed_username for f in results]

@app.get("/users/{username}/followers/count")
def get_followers_count(username: str, session: Session = Depends(get_session)):
    statement = select(Follow).where(Follow.followed_username == username)
    results = session.exec(statement).all()
    return {"count": len(results)}

class CommentCreateRequest(BaseModel):
    username: str
    text: str

@app.post("/designs/{id}/comments")
def create_comment(id: int, req: CommentCreateRequest, session: Session = Depends(get_session)):
    design = session.get(UserDesign, id)
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    comment = Comment(design_id=id, username=req.username, text=req.text)
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return comment

@app.get("/designs/{id}/comments")
def get_comments(id: int, session: Session = Depends(get_session)):
    statement = select(Comment).where(Comment.design_id == id).order_by(Comment.created_at.asc())
    return session.exec(statement).all()

@app.post("/designs/{id}/like")
def toggle_like(id: int, session: Session = Depends(get_session)):
    design = session.get(UserDesign, id)
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    design.likes += 1
    session.add(design)
    session.commit()
    session.refresh(design)
    return {"status": "success", "likes": design.likes}

@app.post("/users/{username}/view")
def increment_profile_views(username: str, session: Session = Depends(get_session)):
    statement = select(User).where(User.username == username)
    user = session.exec(statement).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.profile_views = (user.profile_views or 0) + 1
    session.add(user)
    session.commit()
    return {"status": "success", "profile_views": user.profile_views}

@app.get("/users/{username}/feed")
def get_user_feed(username: str, session: Session = Depends(get_session)):
    follow_statement = select(Follow).where(Follow.follower_username == username)
    followed = session.exec(follow_statement).all()
    followed_usernames = [f.followed_username for f in followed]
    
    if not followed_usernames:
        return []
        
    statement = select(UserDesign, User.username).join(User, UserDesign.creator_id == User.id).where(User.username.in_(followed_usernames)).order_by(UserDesign.created_at.desc())
    results = session.exec(statement).all()
    
    feed = []
    for design, creator_username in results:
        feed.append({
            "id": design.id,
            "title": design.title,
            "description": design.description,
            "image_url": design.image_url,
            "is_ai_generated": design.is_ai_generated,
            "likes": design.likes,
            "creator_id": design.creator_id,
            "category": design.category or "Couture",
            "is_ready_to_sell": design.is_ready_to_sell,
            "price": design.price,
            "created_at": design.created_at,
            "creator_username": creator_username
        })
    return feed

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
