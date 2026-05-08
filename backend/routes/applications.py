from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

from db.database import get_db
from models import Application, Job

router = APIRouter()

class ApplicationCreate(BaseModel):
    job_id: str
    notes: Optional[str] = None
    follow_up_date: Optional[datetime] = None

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[datetime] = None

@router.get("/")
async def get_applications(db: AsyncSession = Depends(get_db)):
    stmt = select(Application).order_by(Application.applied_date.desc())
    result = await db.execute(stmt)
    apps = result.scalars().all()

    out = []
    for app in apps:
        job_result = await db.execute(select(Job).where(Job.id == app.job_id))
        job = job_result.scalar_one_or_none()
        d = _app_to_dict(app)
        d["job"] = {"id": str(job.id), "title": job.title, "company": job.company, "location": job.location} if job else None
        out.append(d)

    return {"success": True, "data": out}

@router.post("/")
async def create_application(body: ApplicationCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Application).where(Application.job_id == uuid.UUID(body.job_id)))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already applied to this job")

    app = Application(
        job_id=uuid.UUID(body.job_id),
        notes=body.notes,
        follow_up_date=body.follow_up_date,
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return {"success": True, "data": _app_to_dict(app)}

@router.put("/{app_id}")
async def update_application(app_id: str, body: ApplicationUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Application).where(Application.id == uuid.UUID(app_id)))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if body.status is not None:
        app.status = body.status
    if body.notes is not None:
        app.notes = body.notes
    if body.follow_up_date is not None:
        app.follow_up_date = body.follow_up_date

    await db.commit()
    return {"success": True, "data": _app_to_dict(app)}

@router.delete("/{app_id}")
async def delete_application(app_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Application).where(Application.id == uuid.UUID(app_id)))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    await db.delete(app)
    await db.commit()
    return {"success": True}

def _app_to_dict(a: Application) -> dict:
    return {
        "id": str(a.id),
        "jobId": str(a.job_id),
        "appliedDate": a.applied_date.isoformat() if a.applied_date else None,
        "status": a.status,
        "notes": a.notes,
        "followUpDate": a.follow_up_date.isoformat() if a.follow_up_date else None,
        "createdAt": a.created_at.isoformat() if a.created_at else None,
    }
