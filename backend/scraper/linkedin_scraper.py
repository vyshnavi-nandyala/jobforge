import asyncio
from typing import List, Dict, Any
from datetime import datetime
from loguru import logger
import httpx
from bs4 import BeautifulSoup
from .base_scraper import BaseScraper

class LinkedInScraper(BaseScraper):
    source_name = "linkedin"
    BASE_URL = "https://www.linkedin.com/jobs/search"

    async def scrape(self, keywords: List[str], locations: List[str]) -> List[Dict[str, Any]]:
        jobs = []
        search_locations = locations if locations else ["United States", "Remote"]

        async with httpx.AsyncClient(headers=self.get_headers(), timeout=30, follow_redirects=True) as client:
            for keyword in keywords[:2]:
                for location in search_locations[:2]:
                    try:
                        params = {
                            "keywords": keyword,
                            "location": location,
                            "f_TPR": "r86400",
                            "sortBy": "DD",
                            "position": 1,
                            "pageNum": 0,
                        }
                        resp = await client.get(self.BASE_URL, params=params)
                        if resp.status_code != 200:
                            logger.warning(f"LinkedIn returned {resp.status_code}")
                            continue

                        soup = BeautifulSoup(resp.text, "lxml")
                        job_cards = soup.select("div.base-card")[:self.max_jobs]

                        for card in job_cards:
                            try:
                                title_el = card.select_one("h3.base-search-card__title")
                                company_el = card.select_one("h4.base-search-card__subtitle")
                                location_el = card.select_one("span.job-search-card__location")
                                link_el = card.select_one("a.base-card__full-link")
                                time_el = card.select_one("time")

                                if not title_el or not self.is_data_engineer_role(title_el.get_text(strip=True)):
                                    continue

                                job = {
                                    "title": title_el.get_text(strip=True),
                                    "company": company_el.get_text(strip=True) if company_el else "Unknown",
                                    "location": location_el.get_text(strip=True) if location_el else location,
                                    "remote": "remote" in (location_el.get_text(strip=True) if location_el else "").lower(),
                                    "source": self.source_name,
                                    "source_url": link_el["href"].split("?")[0] if link_el else "",
                                    "posting_date": self.parse_date(time_el.get("datetime", "") if time_el else ""),
                                    "description": "",
                                    "requirements": "",
                                    "salary_min": None,
                                    "salary_max": None,
                                    "applicants_count": None,
                                    "required_skills": [],
                                    "experience_level": "mid",
                                }
                                jobs.append(job)
                            except Exception as e:
                                logger.debug(f"LinkedIn card parse error: {e}")
                                continue

                        await self.delay()
                    except Exception as e:
                        logger.error(f"LinkedIn scrape error ({keyword}, {location}): {e}")
                        continue

        logger.info(f"LinkedIn: found {len(jobs)} jobs")
        return jobs
