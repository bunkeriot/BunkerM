import asyncio
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import settings
from app.database.connection import AsyncSessionLocal, engine
from app.database.models import DEFAULT_TENANT_ID, Base, Tenant

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s [%(name)s] %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


async def _run_migrations() -> None:
    """Run Alembic migrations programmatically."""
    from alembic import command
    from alembic.config import Config

    cfg = Config("alembic.ini")
    cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, command.upgrade, cfg, "head")


async def _ensure_default_tenant() -> None:
    from sqlalchemy import select
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Tenant).where(Tenant.id == DEFAULT_TENANT_ID))
        if not result.scalars().first():
            tenant = Tenant(
                id=DEFAULT_TENANT_ID,
                name="Default Community Tenant",
                tier="community",
            )
            db.add(tenant)
            await db.commit()
            logger.info("Created default tenant %s", DEFAULT_TENANT_ID)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.DATABASE_URL.startswith("sqlite"):
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("SQLite tables created")
    else:
        await _run_migrations()
        logger.info("Migrations complete")
    await _ensure_default_tenant()

    from app.ingestion.poller import run_events_poller, run_topics_poller
    from app.metrics.engine import run_metrics_loop
    from app.anomaly.detector import run_anomaly_loop

    tasks = [
        asyncio.create_task(run_topics_poller(), name="topics-poller"),
        asyncio.create_task(run_events_poller(), name="events-poller"),
        asyncio.create_task(run_metrics_loop(), name="metrics-loop"),
        asyncio.create_task(run_anomaly_loop(), name="anomaly-loop"),
    ]
    logger.info("Background tasks started")

    yield

    for task in tasks:
        task.cancel()
    await asyncio.gather(*tasks, return_exceptions=True)
    logger.info("Background tasks stopped")


app = FastAPI(title="BunkerM AI Service", version="1.0.0", lifespan=lifespan)

from app.ingestion.router import router as ingestion_router
from app.metrics.router import router as metrics_router
from app.anomaly.router import router as anomaly_router
from app.alerts.router import router as alerts_router
from app.license.feature_gate import require_feature

app.include_router(ingestion_router)
app.include_router(metrics_router)
app.include_router(anomaly_router)
app.include_router(alerts_router)


@app.get("/health")
async def health():
    return {"status": "ok", "tier": settings.TIER}


@app.get("/assistant/query")
async def assistant_query(_: None = require_feature("llm_assistant")):
    return {"result": "LLM response here"}
