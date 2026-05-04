import logging
import traceback

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.auth import router as auth_router
from app.api.routes.family import router as family_router
from app.api.routes.reminders import router as reminders_router
from app.api.routes.reports import router as reports_router
from app.api.routes.users import router as users_router
from app.core.config import get_settings
from app.db.indexes import ensure_indexes


settings = get_settings()
app = FastAPI(title=settings.app_name)
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup() -> None:
    await ensure_indexes()


@app.exception_handler(Exception)
async def unhandled_exception_handler(_, exc: Exception) -> JSONResponse:
    logger.error("Unhandled application error", exc_info=(type(exc), exc, exc.__traceback__))
    traceback.print_exception(type(exc), exc, exc.__traceback__)
    return JSONResponse(
        status_code=500,
        content={"error": "Something went wrong. Please try again.", "code": "INTERNAL_SERVER_ERROR"},
    )


@app.get("/health")
async def healthcheck() -> dict:
    return {"status": "ok"}


app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(users_router, prefix=settings.api_v1_prefix)
app.include_router(reports_router, prefix=settings.api_v1_prefix)
app.include_router(family_router, prefix=settings.api_v1_prefix)
app.include_router(reminders_router, prefix=settings.api_v1_prefix)
