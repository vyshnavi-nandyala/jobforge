"""Run this once to seed the database with sample jobs."""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from db.database import AsyncSessionLocal, init_db
from models import Job, UserPreferences
from scraper.orchestrator import get_sample_jobs

async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select

        # Seed preferences
        prefs_result = await db.execute(select(UserPreferences).limit(1))
        if not prefs_result.scalar_one_or_none():
            prefs = UserPreferences(
                job_keywords=["data engineer", "data engineering", "analytics engineer"],
                skills=["Python", "SQL", "Spark", "Kafka", "dbt", "Airflow", "AWS", "Snowflake"],
                locations=["Remote", "San Francisco", "New York"],
                salary_min=120000,
                salary_max=250000,
                experience_level="mid",
                remote_only=False,
            )
            db.add(prefs)

        # Seed sample jobs
        sample_jobs = get_sample_jobs()
        for job_data in sample_jobs:
            existing = await db.execute(select(Job).where(Job.source_url == job_data["source_url"]))
            if not existing.scalar_one_or_none():
                job = Job(**{k: v for k, v in job_data.items() if hasattr(Job, k)})
                db.add(job)

        await db.commit()
        print(f"Seeded {len(sample_jobs)} sample jobs and default preferences.")

if __name__ == "__main__":
    asyncio.run(seed())
