from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    mobile_no: Optional[str] = Field(default=None, unique=True, nullable=True)
    email: Optional[str] = Field(default=None, unique=True, nullable=True)
    google_id: Optional[str] = Field(default=None, unique=True, nullable=True)
    bio: Optional[str] = None
    profile_pic: Optional[str] = None
    is_verified_business: bool = Field(default=False)
    profile_views: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    designs: List["UserDesign"] = Relationship(back_populates="creator")

class UserDesign(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    image_url: str
    is_ai_generated: bool = False
    likes: int = Field(default=0)
    creator_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_ready_to_sell: bool = Field(default=False)
    price: float = Field(default=0.0)
    category: str = Field(default="Couture")

    creator: User = Relationship(back_populates="designs")

class Product(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    price: float
    image_url: str
    is_trending: bool = False
    stock_count: int = Field(default=0)
    category: str

class Follow(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    follower_username: str = Field(index=True)
    followed_username: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Comment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    design_id: int = Field(foreign_key="userdesign.id")
    username: str
    text: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
