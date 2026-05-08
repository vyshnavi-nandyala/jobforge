from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, or_
from sqlalchemy.orm import selectinload
from typing import Optional
from datetime import datetime, timedelta
import uuid

from db.database import get_db
from models import Job, UserPreferences
from scraper.orchestrator import run_all_scrapers
from services.ranking_service import rank_and_score_jobs
from loguru import logger

router = APIRouter()

@router.get("/")
async def get_jobs(
    search: Optional[str] = None,
    source: Optional[str] = None,
    remote: Optional[bool] = None,
    min_score: Optional[float] = None,
    saved_only: bool = False,
    sort_by: str = "matched_score",
    order: str = "desc",
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Job)

    filters = []
    if search:
        filters.append(or_(
            Job.title.ilike(f"%{search}%"),
            Job.company.ilike(f"%{search}%"),
            Job.description.ilike(f"%{search}%"),
        ))
    if source:
        filters.append(Job.source == source)
    if remote is not None:
        filters.append(Job.remote == remote)
    if min_score is not None:
        filters.append(Job.matched_score >= min_score)
    if saved_only:
        filters.append(Job.is_saved == True)

    if filters:
        from sqlalchemy import and_
        stmt = stmt.where(and_(*filters))

    col = getattr(Job, sort_by, Job.matched_score)
    stmt = stmt.order_by(col.desc() if order == "desc" else col.asc())
    stmt = stmt.offset(offset).limit(limit)

    result = await db.execute(stmt)
    jobs = result.scalars().all()

    count_stmt = select(Job)
    if filters:
        from sqlalchemy import and_
        count_stmt = count_stmt.where(and_(*filters))
    count_result = await db.execute(count_stmt)
    total = len(count_result.scalars().all())

    return {"success": True, "data": [_job_to_dict(j) for j in jobs], "total": total}

@router.get("/{job_id}")
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Job).where(Job.id == uuid.UUID(job_id))
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"success": True, "data": _job_to_dict(job)}

@router.post("/search")
async def trigger_search(background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    background_tasks.add_task(_run_search, db)
    return {"success": True, "message": "Job search started in background"}

@router.put("/{job_id}/save")
async def toggle_save(job_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Job).where(Job.id == uuid.UUID(job_id))
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.is_saved = not job.is_saved
    await db.commit()
    return {"success": True, "saved": job.is_saved}

@router.delete("/{job_id}")
async def delete_job(job_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Job).where(Job.id == uuid.UUID(job_id))
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    await db.delete(job)
    await db.commit()
    return {"success": True}

async def _run_search(db: AsyncSession):
    try:
        prefs_result = await db.execute(select(UserPreferences).limit(1))
        prefs = prefs_result.scalar_one_or_none()
        keywords = prefs.job_keywords if prefs else ["data engineer"]
        locations = prefs.locations if prefs else []

        raw_jobs = await run_all_scrapers(keywords, locations)
        scored = await rank_and_score_jobs(raw_jobs, prefs)

        cutoff = datetime.utcnow() - timedelta(hours=24)
        for job_data in scored:
            existing = await db.execute(select(Job).where(Job.source_url == job_data["source_url"]))
            if existing.scalar_one_or_none():
                continue
            job = Job(**{k: v for k, v in job_data.items() if hasattr(Job, k)})
            db.add(job)
        await db.commit()
        logger.info(f"Job search complete. Added {len(scored)} jobs.")
    except Exception as e:
        logger.error(f"Job search failed: {e}")

def _job_to_dict(job: Job) -> dict:
    return {
        "id": str(job.id),
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "remote": job.remote,
        "description": job.description,
        "requirements": job.requirements,
        "salaryMin": job.salary_min,
        "salaryMax": job.salary_max,
        "salaryCurrency": job.salary_currency,
        "postingDate": job.posting_date.isoformat() if job.posting_date else None,
        "applicantsCount": job.applicants_count,
        "source": job.source,
        "sourceUrl": job.source_url,
        "matchedScore": job.matched_score,
        "isSaved": job.is_saved,
        "requiredSkills": job.required_skills or [],
        "experienceLevel": job.experience_level,
        "createdAt": job.created_at.isoformat() if job.created_at else None,
    }
