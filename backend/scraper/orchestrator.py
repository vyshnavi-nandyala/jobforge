import asyncio
from typing import List, Dict, Any
from loguru import logger
from datetime import datetime

from .linkedin_scraper import LinkedInScraper
from .indeed_scraper import IndeedScraper
from .glassdoor_scraper import GlassdoorScraper
from .ziprecruiter_scraper import ZipRecruiterScraper
from .monster_scraper import MonsterScraper

SCRAPERS = [
    LinkedInScraper,
    IndeedScraper,
    GlassdoorScraper,
    ZipRecruiterScraper,
    MonsterScraper,
]

async def run_all_scrapers(keywords: List[str], locations: List[str]) -> List[Dict[str, Any]]:
    logger.info(f"Starting scrapers for keywords: {keywords}, locations: {locations}")
    tasks = [scraper_cls().scrape(keywords, locations) for scraper_cls in SCRAPERS]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_jobs = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            logger.error(f"Scraper {SCRAPERS[i].source_name} failed: {result}")
        else:
            all_jobs.extend(result)

    seen_urls = set()
    deduped = []
    for job in all_jobs:
        url = job.get("source_url", "")
        key = f"{job['title'].lower()}_{job['company'].lower()}"
        if url and url not in seen_urls and key not in seen_urls:
            seen_urls.add(url)
            seen_urls.add(key)
            deduped.append(job)

    logger.info(f"Total unique jobs scraped: {len(deduped)}")
    return deduped

def get_sample_jobs() -> List[Dict[str, Any]]:
    """Return sample jobs for development/testing."""
    now = datetime.utcnow()
    return [
        {
            "title": "Senior Data Engineer",
            "company": "Stripe",
            "location": "Remote (US)",
            "remote": True,
            "source": "linkedin",
            "source_url": "https://stripe.com/jobs/listing/senior-data-engineer",
            "posting_date": now,
            "description": "We're looking for a Senior Data Engineer to build and maintain our data infrastructure. You'll work with Spark, Kafka, dbt, and Snowflake to process billions of transactions daily.",
            "requirements": "5+ years data engineering. Strong Python, SQL, Spark. Experience with Kafka, dbt, Snowflake or similar. Airflow experience preferred.",
            "salary_min": 160000,
            "salary_max": 220000,
            "applicants_count": 47,
            "required_skills": ["Python", "Spark", "Kafka", "dbt", "Snowflake", "Airflow", "SQL"],
            "experience_level": "senior",
            "matched_score": 0.95,
        },
        {
            "title": "Data Engineer - Platform Team",
            "company": "Databricks",
            "location": "San Francisco, CA / Remote",
            "remote": True,
            "source": "indeed",
            "source_url": "https://databricks.com/company/careers/data-engineer",
            "posting_date": now,
            "description": "Join Databricks to build next-generation data lakehouse infrastructure. Work with Delta Lake, MLflow, and Spark at massive scale.",
            "requirements": "3+ years data engineering. Experience with Spark, Delta Lake, Python. Scala is a plus. Strong understanding of distributed systems.",
            "salary_min": 150000,
            "salary_max": 200000,
            "applicants_count": 89,
            "required_skills": ["Spark", "Delta Lake", "Python", "Scala", "MLflow", "SQL"],
            "experience_level": "mid",
            "matched_score": 0.91,
        },
        {
            "title": "Data Engineer (AWS)",
            "company": "Capital One",
            "location": "McLean, VA / Remote",
            "remote": True,
            "source": "glassdoor",
            "source_url": "https://capitalone.com/careers/data-engineer",
            "posting_date": now,
            "description": "Build scalable data pipelines on AWS. Work with Glue, EMR, Redshift, and S3. Strong focus on data quality and reliability.",
            "requirements": "4+ years experience. AWS (Glue, EMR, Redshift, S3), Python, Spark, Terraform. Experience with real-time streaming preferred.",
            "salary_min": 130000,
            "salary_max": 175000,
            "applicants_count": 124,
            "required_skills": ["AWS", "Python", "Spark", "Redshift", "Glue", "Terraform", "SQL"],
            "experience_level": "mid",
            "matched_score": 0.88,
        },
        {
            "title": "Analytics Engineer",
            "company": "Airbnb",
            "location": "Remote",
            "remote": True,
            "source": "linkedin",
            "source_url": "https://airbnb.com/careers/analytics-engineer",
            "posting_date": now,
            "description": "Build and maintain dbt models to power Airbnb's analytics. Work with Hive, Presto, and Spark on petabyte-scale datasets.",
            "requirements": "3+ years analytics engineering or data engineering. Expert SQL, dbt, Python. Experience with Hive, Spark, Presto. Excellent communication.",
            "salary_min": 145000,
            "salary_max": 190000,
            "applicants_count": 203,
            "required_skills": ["dbt", "SQL", "Python", "Hive", "Presto", "Spark"],
            "experience_level": "mid",
            "matched_score": 0.85,
        },
        {
            "title": "Staff Data Engineer",
            "company": "Figma",
            "location": "Remote (US)",
            "remote": True,
            "source": "ziprecruiter",
            "source_url": "https://figma.com/careers/staff-data-engineer",
            "posting_date": now,
            "description": "Lead data infrastructure projects at Figma. Design schemas, build reliable pipelines, and mentor the data team.",
            "requirements": "7+ years data engineering. Deep expertise in distributed systems, streaming, and data modeling. Python, SQL, Spark, Kafka.",
            "salary_min": 190000,
            "salary_max": 260000,
            "applicants_count": 31,
            "required_skills": ["Python", "Spark", "Kafka", "SQL", "Data Modeling", "Leadership"],
            "experience_level": "staff",
            "matched_score": 0.82,
        },
    ]
