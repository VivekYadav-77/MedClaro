from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status

from app.core.database import get_database


class RateLimiter:
    def __init__(self) -> None:
        self.db = get_database()

    async def enforce(self, user_id: str, action: str, daily_limit: int) -> None:
        now = datetime.now(UTC)
        start_of_day = datetime(now.year, now.month, now.day, tzinfo=UTC)
        expires_at = start_of_day + timedelta(days=1)
        existing = await self.db.rate_limits.find_one({"userId": user_id, "action": action, "windowStart": start_of_day})
        count = int(existing["count"]) + 1 if existing else 1
        if count > daily_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={"error": f"Daily {action} limit reached", "code": "RATE_LIMIT_EXCEEDED"},
            )
        await self.db.rate_limits.update_one(
            {"userId": user_id, "action": action, "windowStart": start_of_day},
            {"$set": {"expiresAt": expires_at}, "$inc": {"count": 1}},
            upsert=True,
        )
