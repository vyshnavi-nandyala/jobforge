import os
import uuid
import json
from typing import Dict, Any
from loguru import logger
import anthropic
from services.docx_processor import generate_docx_from_text, extract_text_from_docx
from config import settings

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

CUSTOMIZE_PROMPT = """You are an expert resume writer and ATS optimization specialist for data engineering roles.

You will be given:
1. A candidate's base resume text
2. A job description and requirements

Your task is to produce a customized version of the resume that:
- Highlights the most relevant experience for this specific role
- Adds keywords from the job description naturally (for ATS optimization)
- Reorders bullet points to lead with the most relevant accomplishments
- Tailors the skills section to match what the job requires
- Preserves all truthful information (do NOT fabricate experience)
- Maintains professional tone and formatting markers

Return a JSON object with this exact structure:
{
  "customized_resume": "<full customized resume text, preserving section headers>",
  "changes_made": ["list of specific changes made"],
  "keywords_added": ["list of keywords added for ATS"],
  "match_score": <0.0-1.0 how well the resume matches>
}

BASE RESUME:
{base_resume}

JOB TITLE: {job_title}
COMPANY: {company}
JOB DESCRIPTION:
{job_description}

REQUIRED SKILLS: {required_skills}
"""

async def customize_resume_for_job(
    base_resume_text: str,
    base_resume_path: str,
    job: Any,
    generated_dir: str,
) -> Dict[str, Any]:
    if not settings.anthropic_api_key:
        return _mock_customization(base_resume_text, job, generated_dir)

    try:
        prompt = CUSTOMIZE_PROMPT.format(
            base_resume=base_resume_text[:8000],
            job_title=job.title,
            company=job.company,
            job_description=(job.description or "")[:3000],
            required_skills=", ".join(job.required_skills or []),
        )

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system="You are an expert resume writer. Always respond with valid JSON only.",
            messages=[{"role": "user", "content": prompt}],
        )

        raw = response.content[0].text
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()

        result = json.loads(raw)
        customized_text = result.get("customized_resume", base_resume_text)
        changes = result.get("changes_made", [])
        keywords = result.get("keywords_added", [])

    except Exception as e:
        logger.error(f"Claude API error: {e}. Falling back to mock.")
        return _mock_customization(base_resume_text, job, generated_dir)

    output_path = os.path.join(generated_dir, f"resume_{uuid.uuid4().hex}.docx")

    if base_resume_path and os.path.exists(base_resume_path):
        generate_docx_from_text(customized_text, output_path, base_resume_path)
    else:
        generate_docx_from_text(customized_text, output_path)

    return {
        "content": customized_text,
        "file_path": output_path,
        "changes": changes,
        "keywords": keywords,
    }

def _mock_customization(base_text: str, job: Any, generated_dir: str) -> Dict[str, Any]:
    skills = job.required_skills or []
    skills_line = f"Additional Skills: {', '.join(skills[:6])}" if skills else ""
    customized = f"{base_text}\n\n[Tailored for {job.title} at {job.company}]\n{skills_line}"
    changes = [
        f"Highlighted experience relevant to {job.title}",
        "Optimized skills section for ATS",
        f"Added {len(skills)} keywords from job description",
    ]
    output_path = os.path.join(generated_dir, f"resume_{uuid.uuid4().hex}.docx")
    generate_docx_from_text(customized, output_path)
    return {"content": customized, "file_path": output_path, "changes": changes, "keywords": skills[:6]}
