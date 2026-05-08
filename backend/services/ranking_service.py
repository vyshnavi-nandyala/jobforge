from typing import List, Dict, Any, Optional
from loguru import logger

DE_SKILLS = {
    "python", "sql", "spark", "kafka", "airflow", "dbt", "snowflake",
    "redshift", "bigquery", "databricks", "aws", "gcp", "azure",
    "terraform", "kubernetes", "docker", "scala", "java", "hadoop",
    "hive", "presto", "flink", "glue", "emr", "s3", "data modeling",
    "etl", "elt", "pipeline", "streaming", "batch", "delta lake",
    "iceberg", "parquet", "git", "ci/cd",
}

async def rank_and_score_jobs(jobs: List[Dict[str, Any]], prefs=None) -> List[Dict[str, Any]]:
    user_skills = set()
    salary_min = 0
    salary_max = 0
    locations = []

    if prefs:
        user_skills = {s.lower() for s in (prefs.skills or [])}
        salary_min = prefs.salary_min or 0
        salary_max = prefs.salary_max or 0
        locations = [l.lower() for l in (prefs.locations or [])]

    scored = []
    for job in jobs:
        score = _compute_score(job, user_skills, salary_min, salary_max, locations)
        job["matched_score"] = round(score, 3)
        scored.append(job)

    scored.sort(key=lambda j: (j["matched_score"], -(j.get("applicants_count") or 999)), reverse=True)
    logger.info(f"Ranked {len(scored)} jobs")
    return scored

def _compute_score(job: Dict, user_skills: set, salary_min: int, salary_max: int, locations: List[str]) -> float:
    score = 0.5

    required = {s.lower() for s in (job.get("required_skills") or [])}
    if required:
        overlap = user_skills & required
        skill_score = len(overlap) / len(required) if required else 0
        score += skill_score * 0.3

    applicants = job.get("applicants_count")
    if applicants is not None:
        if applicants < 50:
            score += 0.1
        elif applicants < 100:
            score += 0.05
        elif applicants > 300:
            score -= 0.05

    job_salary_min = job.get("salary_min") or 0
    if salary_min > 0 and job_salary_min > 0:
        if job_salary_min >= salary_min:
            score += 0.1
        elif job_salary_min < salary_min * 0.8:
            score -= 0.1

    if job.get("remote") and "remote" in locations:
        score += 0.05

    loc = (job.get("location") or "").lower()
    if any(l in loc for l in locations if l != "remote"):
        score += 0.05

    return max(0.0, min(1.0, score))
