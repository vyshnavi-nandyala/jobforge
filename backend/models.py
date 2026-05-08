from sqlalchemy import Column, String, Text, Integer, Float, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from db.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(255))
    remote = Column(Boolean, default=False)
    description = Column(Text)
    requirements = Column(Text)
    salary_min = Column(Integer)
    salary_max = Column(Integer)
    salary_currency = Column(String(10), default="USD")
    posting_date = Column(DateTime)
    applicants_count = Column(Integer)
    source = Column(String(50))
    source_url = Column(String(1000))
    matched_score = Column(Float, default=0.0)
    is_saved = Column(Boolean, default=False)
    required_skills = Column(JSON, default=list)
    experience_level = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

    resume = relationship("Resume", back_populates="job", uselist=False, cascade="all, delete-orphan")
    application = relationship("Application", back_populates="job", uselist=False, cascade="all, delete-orphan")

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"))
    customized_content = Column(Text)
    file_path = Column(String(500))
    changes_made = Column(JSON, default=list)
    keywords_added = Column(JSON, default=list)
    download_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("Job", back_populates="resume")

class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"))
    applied_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="applied")
    notes = Column(Text)
    follow_up_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    job = relationship("Job", back_populates="application")

class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_keywords = Column(JSON, default=lambda: ["data engineer", "data engineering"])
    skills = Column(JSON, default=list)
    locations = Column(JSON, default=list)
    salary_min = Column(Integer, default=0)
    salary_max = Column(Integer, default=0)
    experience_level = Column(String(50), default="mid")
    remote_only = Column(Boolean, default=False)
    email = Column(String(255))
    base_resume_path = Column(String(500))
    base_resume_content = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
