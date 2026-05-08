from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from db.database import get_db
from models import UserPreferences

router = APIRouter()

class PreferencesUpdate(BaseModel):
    job_keywords: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    experience_level: Optional[str] = None
    remote_only: Optional[bool] = None
    email: Optional[str] = None

@router.get("/")
async def get_preferences(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserPreferences).limit(1))
    prefs = result.scalar_one_or_none()
    if not prefs:
        prefs = UserPreferences()
        db.add(prefs)
        await db.commit()
        await db.refresh(prefs)
    return {"success": True, "data": _prefs_to_dict(prefs)}

@router.post("/")
async def update_preferences(body: PreferencesUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserPreferences).limit(1))
    prefs = result.scalar_one_or_none()
    if not prefs:
        prefs = UserPreferences()
        db.add(prefs)

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(prefs, field, value)
    prefs.updated_at = datetime.utcnow()

    await db.commit()
    return {"success": True, "data": _prefs_to_dict(prefs)}

def _prefs_to_dict(p: UserPreferences) -> dict:
    return {
        "id": str(p.id),
        "jobKeywords": p.job_keywords or ["data engineer"],
        "skills": p.skills or [],
        "locations": p.locations or [],
        "salaryMin": p.salary_min or 0,
        "salaryMax": p.salary_max or 0,
        "experienceLevel": p.experience_level or "mid",
        "remoteOnly": p.remote_only or False,
        "email": p.email or "",
        "hasResume": bool(p.base_resume_path),
        "updatedAt": p.updated_at.isoformat() if p.updated_at else None,
    }
