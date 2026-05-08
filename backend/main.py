from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from loguru import logger
import os

from config import settings
from db.database import init_db
from routes import jobs, resume, applications, settings as settings_router
from services.scheduler import start_scheduler, stop_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting JobForge API...")
    await init_db()
    start_scheduler()
    yield
    stop_scheduler()
    logger.info("JobForge API shutdown complete")

app = FastAPI(
    title="JobForge API",
    description="AI-powered job search and resume customization engine",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if os.path.exists(settings.generated_dir):
    app.mount("/generated", StaticFiles(directory=settings.generated_dir), name="generated")

app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(resume.router, prefix="/api/resume", tags=["Resume"])
app.include_router(applications.router, prefix="/api/applications", tags=["Applications"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["Settings"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "JobForge API", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=True)
