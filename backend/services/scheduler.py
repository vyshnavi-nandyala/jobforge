from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from loguru import logger
import asyncio

scheduler = AsyncIOScheduler()

async def _daily_job_search():
    from db.database import AsyncSessionLocal
    from sqlalchemy import select
    from models import UserPreferences, Job
    from scraper.orchestrator import run_all_scrapers
    from services.ranking_service import rank_and_score_jobs
    from datetime import datetime

    logger.info("Running scheduled daily job search...")
    async with AsyncSessionLocal() as db:
        try:
            prefs_result = await db.execute(select(UserPreferences).limit(1))
            prefs = prefs_result.scalar_one_or_none()
            keywords = prefs.job_keywords if prefs else ["data engineer"]
            locations = prefs.locations if prefs else []

            raw_jobs = await run_all_scrapers(keywords, locations)
            scored = await rank_and_score_jobs(raw_jobs, prefs)

            added = 0
            for job_data in scored:
                existing = await db.execute(select(Job).where(Job.source_url == job_data.get("source_url", "")))
                if existing.scalar_one_or_none():
                    continue
                job = Job(**{k: v for k, v in job_data.items() if hasattr(Job, k)})
                db.add(job)
                added += 1

            await db.commit()
            logger.info(f"Scheduled search complete: added {added} new jobs")
        except Exception as e:
            logger.error(f"Scheduled job search failed: {e}")

def start_scheduler():
    scheduler.add_job(
        _daily_job_search,
        CronTrigger(hour=9, minute=0),
        id="daily_job_search",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Job scheduler started (daily at 09:00)")

def stop_scheduler():
    scheduler.shutdown(wait=False)
    logger.info("Scheduler stopped")
