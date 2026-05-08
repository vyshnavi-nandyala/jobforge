from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid, os, aiofiles

from db.database import get_db
from models import Job, Resume, UserPreferences
from ai.resume_customizer import customize_resume_for_job
from services.docx_processor import extract_text_from_docx
from config import settings
from loguru import logger

router = APIRouter()

@router.post("/upload")
async def upload_resume(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    if not file.filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="Only DOCX files are supported")

    filename = f"base_resume_{uuid.uuid4().hex}.docx"
    path = os.path.join(settings.uploads_dir, filename)

    async with aiofiles.open(path, "wb") as f:
        content = await file.read()
        await f.write(content)

    text = extract_text_from_docx(path)

    result = await db.execute(select(UserPreferences).limit(1))
    prefs = result.scalar_one_or_none()
    if not prefs:
        prefs = UserPreferences()
        db.add(prefs)

    prefs.base_resume_path = path
    prefs.base_resume_content = text
    await db.commit()

    return {"success": True, "message": "Resume uploaded", "extractedText": text[:500] + "..." if len(text) > 500 else text}

@router.post("/customize/{job_id}")
async def customize_resume(job_id: str, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    job_result = await db.execute(select(Job).where(Job.id == uuid.UUID(job_id)))
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    prefs_result = await db.execute(select(UserPreferences).limit(1))
    prefs = prefs_result.scalar_one_or_none()
    if not prefs or not prefs.base_resume_path:
        raise HTTPException(status_code=400, detail="Please upload your base resume first")

    existing_result = await db.execute(select(Resume).where(Resume.job_id == uuid.UUID(job_id)))
    existing = existing_result.scalar_one_or_none()

    if existing:
        return {"success": True, "message": "Resume already customized", "data": _resume_to_dict(existing)}

    background_tasks.add_task(_customize_async, job_id, db)
    return {"success": True, "message": "Resume customization started"}

@router.post("/customize/{job_id}/sync")
async def customize_resume_sync(job_id: str, db: AsyncSession = Depends(get_db)):
    job_result = await db.execute(select(Job).where(Job.id == uuid.UUID(job_id)))
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    prefs_result = await db.execute(select(UserPreferences).limit(1))
    prefs = prefs_result.scalar_one_or_none()
    if not prefs or not prefs.base_resume_content:
        raise HTTPException(status_code=400, detail="Please upload your base resume first")

    result = await customize_resume_for_job(
        base_resume_text=prefs.base_resume_content,
        base_resume_path=prefs.base_resume_path,
        job=job,
        generated_dir=settings.generated_dir,
    )

    existing_result = await db.execute(select(Resume).where(Resume.job_id == uuid.UUID(job_id)))
    existing = existing_result.scalar_one_or_none()

    if existing:
        existing.customized_content = result["content"]
        existing.file_path = result["file_path"]
        existing.changes_made = result["changes"]
        existing.keywords_added = result["keywords"]
    else:
        resume = Resume(
            job_id=uuid.UUID(job_id),
            customized_content=result["content"],
            file_path=result["file_path"],
            changes_made=result["changes"],
            keywords_added=result["keywords"],
        )
        db.add(resume)

    await db.commit()
    await db.refresh(existing if existing else resume)
    return {"success": True, "data": _resume_to_dict(existing if existing else resume)}

@router.get("/{job_id}")
async def get_resume(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Resume).where(Resume.job_id == uuid.UUID(job_id)))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="No customized resume for this job yet")
    return {"success": True, "data": _resume_to_dict(resume)}

@router.get("/{job_id}/download")
async def download_resume(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Resume).where(Resume.job_id == uuid.UUID(job_id)))
    resume = result.scalar_one_or_none()
    if not resume or not resume.file_path or not os.path.exists(resume.file_path):
        raise HTTPException(status_code=404, detail="Resume file not found")

    resume.download_count += 1
    await db.commit()

    job_result = await db.execute(select(Job).where(Job.id == uuid.UUID(job_id)))
    job = job_result.scalar_one_or_none()
    company = job.company.replace(" ", "_") if job else "company"

    return FileResponse(
        resume.file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=f"Resume_{company}.docx",
    )

async def _customize_async(job_id: str, db: AsyncSession):
    try:
        job_result = await db.execute(select(Job).where(Job.id == uuid.UUID(job_id)))
        job = job_result.scalar_one_or_none()
        prefs_result = await db.execute(select(UserPreferences).limit(1))
        prefs = prefs_result.scalar_one_or_none()
        if not job or not prefs:
            return

        result = await customize_resume_for_job(
            base_resume_text=prefs.base_resume_content or "",
            base_resume_path=prefs.base_resume_path or "",
            job=job,
            generated_dir=settings.generated_dir,
        )

        resume = Resume(
            job_id=uuid.UUID(job_id),
            customized_content=result["content"],
            file_path=result["file_path"],
            changes_made=result["changes"],
            keywords_added=result["keywords"],
        )
        db.add(resume)
        await db.commit()
    except Exception as e:
        logger.error(f"Resume customization failed: {e}")

def _resume_to_dict(r: Resume) -> dict:
    return {
        "id": str(r.id),
        "jobId": str(r.job_id),
        "customizedContent": r.customized_content,
        "filePath": r.file_path,
        "changesMade": r.changes_made or [],
        "keywordsAdded": r.keywords_added or [],
        "downloadCount": r.download_count,
        "createdAt": r.created_at.isoformat() if r.created_at else None,
    }
