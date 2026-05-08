import asyncio
import random
from typing import List, Dict, Any, Optional
from datetime import datetime
from loguru import logger
from fake_useragent import UserAgent
from config import settings

ua = UserAgent()

DATA_ENGINEER_KEYWORDS = [
    "data engineer", "data engineering", "etl developer", "pipeline engineer",
    "big data engineer", "platform engineer", "analytics engineer",
]

class BaseScraper:
    source_name: str = "base"

    def __init__(self):
        self.delay_min = settings.scrape_delay_min
        self.delay_max = settings.scrape_delay_max
        self.max_jobs = settings.max_jobs_per_source

    async def delay(self):
        await asyncio.sleep(random.uniform(self.delay_min, self.delay_max))

    def get_headers(self) -> Dict[str, str]:
        return {
            "User-Agent": ua.random,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        }

    def is_data_engineer_role(self, title: str) -> bool:
        title_lower = title.lower()
        return any(kw in title_lower for kw in DATA_ENGINEER_KEYWORDS)

    def parse_salary(self, salary_str: str) -> tuple[Optional[int], Optional[int]]:
        if not salary_str:
            return None, None
        import re
        nums = re.findall(r'[\d,]+', salary_str.replace(",", ""))
        nums = [int(n) for n in nums if n.isdigit() and int(n) > 1000]
        if len(nums) >= 2:
            return min(nums), max(nums)
        elif len(nums) == 1:
            return nums[0], nums[0]
        return None, None

    def parse_applicants(self, text: str) -> Optional[int]:
        if not text:
            return None
        import re
        nums = re.findall(r'\d+', text.replace(",", ""))
        return int(nums[0]) if nums else None

    def parse_date(self, text: str) -> Optional[datetime]:
        if not text:
            return None
        now = datetime.utcnow()
        text = text.lower().strip()
        if "just now" in text or "today" in text:
            return now
        if "hour" in text:
            import re
            h = re.findall(r'\d+', text)
            return now.replace(hour=max(0, now.hour - int(h[0]))) if h else now
        if "day" in text:
            import re
            d = re.findall(r'\d+', text)
            from datetime import timedelta
            return now - timedelta(days=int(d[0])) if d else now
        return now

    async def scrape(self, keywords: List[str], locations: List[str]) -> List[Dict[str, Any]]:
        raise NotImplementedError
