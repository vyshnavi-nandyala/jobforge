from typing import List, Dict, Any
from loguru import logger
import httpx
from bs4 import BeautifulSoup
from .base_scraper import BaseScraper

class ZipRecruiterScraper(BaseScraper):
    source_name = "ziprecruiter"
    BASE_URL = "https://www.ziprecruiter.com/jobs-search"

    async def scrape(self, keywords: List[str], locations: List[str]) -> List[Dict[str, Any]]:
        jobs = []
        async with httpx.AsyncClient(headers=self.get_headers(), timeout=30, follow_redirects=True) as client:
            for keyword in keywords[:1]:
                try:
                    params = {"search": keyword, "location": "Remote", "days": "1"}
                    resp = await client.get(self.BASE_URL, params=params)
                    if resp.status_code != 200:
                        continue
                    soup = BeautifulSoup(resp.text, "lxml")
                    cards = soup.select("article.job_result, div.jobList-item")[:self.max_jobs]
                    for card in cards:
                        try:
                            title_el = card.select_one("h2.title a, a.job_link")
                            company_el = card.select_one("a.company_name, span.company_name")
                            location_el = card.select_one("span.location, div.location")
                            salary_el = card.select_one("span.salary, div.salary_text")
                            applicants_el = card.select_one("span.num_applicants")
                            if not title_el or not self.is_data_engineer_role(title_el.get_text(strip=True)):
                                continue
                            sal_min, sal_max = self.parse_salary(salary_el.get_text(strip=True) if salary_el else "")
                            href = title_el.get("href", "")
                            jobs.append({
                                "title": title_el.get_text(strip=True),
                                "company": company_el.get_text(strip=True) if company_el else "Unknown",
                                "location": location_el.get_text(strip=True) if location_el else "Remote",
                                "remote": True,
                                "source": self.source_name,
                                "source_url": href if href.startswith("http") else f"https://www.ziprecruiter.com{href}",
                                "posting_date": None,
                                "description": "",
                                "requirements": "",
                                "salary_min": sal_min,
                                "salary_max": sal_max,
                                "applicants_count": self.parse_applicants(applicants_el.get_text() if applicants_el else ""),
                                "required_skills": [],
                                "experience_level": "mid",
                            })
                        except Exception as e:
                            logger.debug(f"ZipRecruiter card error: {e}")
                    await self.delay()
                except Exception as e:
                    logger.error(f"ZipRecruiter error: {e}")
        logger.info(f"ZipRecruiter: found {len(jobs)} jobs")
        return jobs
