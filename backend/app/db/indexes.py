from app.core.database import get_database


async def ensure_indexes() -> None:
    db = get_database()
    await db.users.create_index("googleId", unique=True, sparse=True)
    await db.users.create_index("emailHash", unique=True)
    await db.users.create_index("deletedAt")
    await db.reports.create_index([("userId", 1), ("familyMemberId", 1), ("uploadDate", -1)])
    await db.reports.create_index([("userId", 1), ("reportType", 1), ("reportDate", 1)])
    await db.reminders.create_index([("userId", 1), ("reportId", 1)])
    await db.reminders.create_index("reminderDate")
    await db.rate_limits.create_index("expiresAt", expireAfterSeconds=0)
    await db.analysis_queue.create_index("createdAt")
