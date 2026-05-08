from typing import List, Dict, Any
from loguru import logger
import httpx
from bs4 import BeautifulSoup
from .base_scraper import BaseScraper

class MonsterScraper(BaseScraper):
    source_name = "monster"
    BASE_URL = "https://www.monster.com/jobs/search"

    async def scrape(self, keywords: List[str], locations: List[str]) -> List[Dict[str, Any]]:
        jobs = []
        async with httpx.AsyncClient(headers=self.get_headers(), timeout=30, follow_redirects=True) as client:
            for keyword in keywords[:1]:
                try:
                    params = {"q": keyword, "where": "Remote", "tm": "1"}
                    resp = await client.get(self.BASE_URL, params=params)
                    if resp.status_code != 200:
                        continue
                    soup = BeautifulSoup(resp.text, "lxml")
                    cards = soup.select("section.card-content, div.job-cardstyle__JobCardComponent")[:self.max_jobs]
                    for card in cards:
                        try:
                            title_el = card.select_one("h2.title a, a[data-bypass]")
                            company_el = card.select_one("div.company span, span.name")
                            location_el = card.select_one("div.location span, div.location")
                            if not title_el or not self.is_data_engineer_role(title_el.get_text(strip=True)):
                                continue
                            href = title_el.get("href", "")
                            jobs.append({
                                "title": title_el.get_text(strip=True),
                                "company": company_el.get_text(strip=True) if company_el else "Unknown",
                                "location": location_el.get_text(strip=True) if location_el else "Remote",
                                "remote": "remote" in (location_el.get_text(strip=True) if location_el else "").lower(),
                                "source": self.source_name,
                                "source_url": href if href.startswith("http") else f"https://www.monster.com{href}",
                                "posting_date": None,
                                "description": "",
                                "requirements": "",
                                "salary_min": None,
                                "salary_max": None,
                                "applicants_count": None,
                                "required_skills": [],
                                "experience_level": "mid",
                            })
                        except Exception as e:
                            logger.debug(f"Monster card error: {e}")
                    await self.delay()
                except Exception as e:
                    logger.error(f"Monster error: {e}")
        logger.info(f"Monster: found {len(jobs)} jobs")
        return jobs
