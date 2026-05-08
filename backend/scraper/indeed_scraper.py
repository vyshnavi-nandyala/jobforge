import asyncio
from typing import List, Dict, Any
from loguru import logger
import httpx
from bs4 import BeautifulSoup
from .base_scraper import BaseScraper

class IndeedScraper(BaseScraper):
    source_name = "indeed"
    BASE_URL = "https://www.indeed.com/jobs"

    async def scrape(self, keywords: List[str], locations: List[str]) -> List[Dict[str, Any]]:
        jobs = []
        search_locs = locations if locations else ["remote", "United States"]

        async with httpx.AsyncClient(headers=self.get_headers(), timeout=30, follow_redirects=True) as client:
            for keyword in keywords[:2]:
                for location in search_locs[:2]:
                    try:
                        params = {
                            "q": keyword,
                            "l": location,
                            "fromage": "1",
                            "sort": "date",
                        }
                        resp = await client.get(self.BASE_URL, params=params)
                        if resp.status_code != 200:
                            logger.warning(f"Indeed returned {resp.status_code}")
                            continue

                        soup = BeautifulSoup(resp.text, "lxml")
                        cards = soup.select("div.job_seen_beacon, div.resultContent")[:self.max_jobs]

                        for card in cards:
                            try:
                                title_el = card.select_one("h2.jobTitle span, h2.jobTitle a")
                                company_el = card.select_one("span.companyName, [data-testid='company-name']")
                                location_el = card.select_one("div.companyLocation, [data-testid='text-location']")
                                salary_el = card.select_one("div.salary-snippet, [data-testid='attribute_snippet_testid']")
                                link_el = card.select_one("a.jcs-JobTitle, h2.jobTitle a")

                                if not title_el or not self.is_data_engineer_role(title_el.get_text(strip=True)):
                                    continue

                                loc_text = location_el.get_text(strip=True) if location_el else location
                                salary_text = salary_el.get_text(strip=True) if salary_el else ""
                                sal_min, sal_max = self.parse_salary(salary_text)
                                href = link_el.get("href", "") if link_el else ""
                                url = f"https://www.indeed.com{href}" if href.startswith("/") else href

                                job = {
                                    "title": title_el.get_text(strip=True),
                                    "company": company_el.get_text(strip=True) if company_el else "Unknown",
                                    "location": loc_text,
                                    "remote": "remote" in loc_text.lower(),
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
                                }
                                jobs.append(job)
                            except Exception as e:
                                logger.debug(f"Indeed card parse error: {e}")
                                continue

                        await self.delay()
                    except Exception as e:
                        logger.error(f"Indeed scrape error: {e}")
                        continue

        logger.info(f"Indeed: found {len(jobs)} jobs")
        return jobs
