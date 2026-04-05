from __future__ import annotations
from pydantic import BaseModel, EmailStr, Field
from app.schemas.user import UserRead
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=8, max_length=128)
class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
