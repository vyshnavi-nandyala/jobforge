from typing import List, Dict, Any
from loguru import logger
import httpx
from bs4 import BeautifulSoup
from .base_scraper import BaseScraper

class GlassdoorScraper(BaseScraper):
    source_name = "glassdoor"
    BASE_URL = "https://www.glassdoor.com/Job/jobs.htm"

    async def scrape(self, keywords: List[str], locations: List[str]) -> List[Dict[str, Any]]:
        jobs = []
        async with httpx.AsyncClient(headers=self.get_headers(), timeout=30, follow_redirects=True) as client:
            for keyword in keywords[:1]:
                try:
                    params = {"sc.keyword": keyword, "locT": "N", "locId": "1", "jobType": ""}
                    resp = await client.get(self.BASE_URL, params=params)
                    if resp.status_code != 200:
                        continue
                    soup = BeautifulSoup(resp.text, "lxml")
                    cards = soup.select("li.react-job-listing, article.JobCard_jobCardContainer__arMTi")[:self.max_jobs]
                    for card in cards:
                        try:
                            title_el = card.select_one("a.JobCard_seoLink__WdqHZ, [data-test='job-title']")
                            company_el = card.select_one("span.EmployerProfile_compactEmployerName__9MGcV, [data-test='employer-name']")
                            location_el = card.select_one("div.JobCard_location__rCz3x, [data-test='emp-location']")
                            salary_el = card.select_one("div.JobCard_salaryEstimate__QpbTW, [data-test='detailSalary']")
                            if not title_el or not self.is_data_engineer_role(title_el.get_text(strip=True)):
                                continue
                            sal_min, sal_max = self.parse_salary(salary_el.get_text(strip=True) if salary_el else "")
                            href = title_el.get("href", "")
                            url = f"https://www.glassdoor.com{href}" if href.startswith("/") else href
                            jobs.append({
                                "title": title_el.get_text(strip=True),
                                "company": company_el.get_text(strip=True) if company_el else "Unknown",
                                "location": location_el.get_text(strip=True) if location_el else "",
                                "remote": "remote" in (location_el.get_text(strip=True) if location_el else "").lower(),
                                "source": self.source_name,
                                "source_url": url,
                                "posting_date": None,
                                "description": "",
                                "requirements": "",
                                "salary_min": sal_min,
                                "salary_max": sal_max,
                                "applicants_count": None,
                                "required_skills": [],
                                "experience_level": "mid",
                            })
                        except Exception as e:
                            logger.debug(f"Glassdoor card error: {e}")
                    await self.delay()
                except Exception as e:
                    logger.error(f"Glassdoor scrape error: {e}")
        logger.info(f"Glassdoor: found {len(jobs)} jobs")
        return jobs
