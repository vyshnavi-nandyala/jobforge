import os
import uuid
import json
from typing import Dict, Any
from loguru import logger
import anthropic
from services.docx_processor import generate_docx_from_text, extract_text_from_docx
from config import settings

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

CUSTOMIZE_PROMPT = """You are a senior hiring manager and ATS optimization specialist with 15+ years of experience reviewing Data Engineer resumes. Rewrite the candidate's resume to be perfectly aligned with the job description below.

=== REWRITING INSTRUCTIONS ===

1. QUANTIFIABLE EVIDENCE — Every bullet must include measurable impact (e.g., "reduced pipeline latency by 40%", "processed 2TB daily", "cut deployment time from 3 hours to 20 minutes").

2. STRONG ACTION VERBS — Start every bullet with a powerful verb: Engineered, Architected, Designed, Optimized, Automated, Developed, Implemented, Streamlined, Deployed, Led, Reduced, Accelerated, Migrated, Built, Integrated.

3. ATS KEYWORD PLACEMENT — Put the most critical keywords from the job description first in the skills section and in the first sentence of each bullet. Maximize keyword density naturally.

4. STRUCTURE — Use this exact order:
   - Professional Summary (4-5 sentences)
   - Key Skills / Technical Skills
   - Professional Experience (company by company)
   - Education
   - Certifications (if any)

5. BULLET POINTS — Write exactly 10 bullet points per company role. Each bullet must be 1-2 lines long — not too short, not a paragraph. Target "Roles and Responsibilities", "What You'll Do", "What You'll Bring", "Preferred Qualifications" sections from the job description directly. Make each company's bullets different and tailored to that company's domain.

6. COMPANY DOMAINS — Align bullet content to each company's industry context:
   - Infosys Limited → Waste Management domain
   - HSBC → Banking and Financial Services domain
   - Accenture → Cox Communications / Telecom domain
   - Cognizant → Toyota / Automotive domain
   - Voya Financial → Financial Services / Insurance domain
   - Sun Solutions → Consulting / Technology domain
   For Infosys specifically, weave in: AWS Lambda, Kinesis, S3, DynamoDB, CloudFormation, Python, dbt, Snowflake, SQL, GitHub Copilot, Cortex AI.

7. KEY SKILLS COVERAGE — Every technical skill, tool, language, and technology mentioned in the job description MUST appear somewhere in the resume (skills section or bullet points). Target a 100% ATS match score.

8. SKILLS IN FIRST 4 ROLES — Ensure all key skills from the job description appear naturally within the first 4 company roles' bullet points.

9. PROFESSIONAL SUMMARY — Write a 4-5 sentence summary that:
   - Matches 3-4 major keywords directly from the job description
   - Balances technical skills + quantified achievements + collaboration
   - Sounds like a senior engineer wrote it, not AI
   - Is concise and powerful — no filler phrases

10. TONE & AUTHENTICITY — Write like a real senior Data Engineer. Avoid AI-sounding phrases ("leveraged synergies", "spearheaded initiatives", "robust solutions"). Be specific, grounded, and authentic. Do NOT use the "+" character anywhere.

11. ATS OPTIMIZATION — The final resume must be formatted in plain text with clear section headers. No tables, no columns, no graphics. Use standard section names. Put the most critical keywords in the top third of the resume.

=== RESPONSE FORMAT ===
Return a JSON object with this exact structure:
{{
  "customized_resume": "<full rewritten resume text with all sections>",
  "changes_made": ["list of specific changes made to align with the job description"],
  "keywords_added": ["list of ATS keywords added from the job description"],
  "match_score": <0.0-1.0 estimated ATS match score>,
  "top_skills": ["10 most critical skills from the job description separated by /"],
  "summary": "<the 4-5 sentence professional summary written for this specific job>"
}}

=== INPUTS ===

BASE RESUME:
{base_resume}

TARGET ROLE: {job_title} at {company}

JOB DESCRIPTION:
{job_description}

REQUIRED SKILLS FROM JOB: {required_skills}
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
        top_skills = result.get("top_skills", [])
        summary = result.get("summary", "")

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
        "top_skills": top_skills,
        "summary": summary,
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
