import json
from typing import List, Dict, Any
from loguru import logger
import anthropic
from config import settings

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

AGENT_TOOLS = [
    {
        "name": "search_jobs",
        "description": "Search for data engineer jobs across all job boards",
        "input_schema": {
            "type": "object",
            "properties": {
                "keywords": {"type": "array", "items": {"type": "string"}},
                "locations": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["keywords"],
        },
    },
    {
        "name": "analyze_job",
        "description": "Analyze a job description and extract key requirements",
        "input_schema": {
            "type": "object",
            "properties": {
                "job_title": {"type": "string"},
                "job_description": {"type": "string"},
                "company": {"type": "string"},
            },
            "required": ["job_title", "job_description"],
        },
    },
    {
        "name": "rank_jobs",
        "description": "Rank jobs by match score against user profile",
        "input_schema": {
            "type": "object",
            "properties": {
                "jobs": {"type": "array"},
                "user_skills": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["jobs", "user_skills"],
        },
    },
]

async def run_job_search_agent(
    user_prefs: Dict[str, Any],
    jobs: List[Dict[str, Any]],
) -> Dict[str, Any]:
    if not settings.anthropic_api_key:
        return {"recommendations": jobs[:5], "analysis": "Sample recommendations (no API key set)"}

    try:
        system = """You are JobForge, an AI agent that helps data engineers find their ideal jobs.
        Analyze the available jobs, rank them by fit, and provide actionable recommendations.
        Be concise and specific."""

        user_msg = f"""
        User Profile:
        - Skills: {', '.join(user_prefs.get('skills', []))}
        - Experience Level: {user_prefs.get('experience_level', 'mid')}
        - Preferred locations: {', '.join(user_prefs.get('locations', ['Remote']))}
        - Salary range: ${user_prefs.get('salary_min', 0):,} - ${user_prefs.get('salary_max', 0):,}

        Available jobs ({len(jobs)} total):
        {json.dumps([{
            'title': j.get('title'), 'company': j.get('company'),
            'salary_min': j.get('salary_min'), 'salary_max': j.get('salary_max'),
            'required_skills': j.get('required_skills', []),
            'applicants_count': j.get('applicants_count'),
        } for j in jobs[:10]], indent=2)}

        Provide your top 5 job recommendations with brief reasoning for each.
        Format as JSON: {{"recommendations": [{{"rank": 1, "company": "...", "title": "...", "reason": "..."}}], "summary": "..."}}
        """

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=system,
            messages=[{"role": "user", "content": user_msg}],
        )

        raw = response.content[0].text
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        return json.loads(raw)

    except Exception as e:
        logger.error(f"Agent error: {e}")
        return {"recommendations": [], "summary": "Agent unavailable"}
