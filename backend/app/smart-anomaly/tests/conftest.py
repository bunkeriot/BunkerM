import asyncio
import uuid
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database.models import Base, DEFAULT_TENANT_ID, Tenant

# Use SQLite in-memory for tests
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DB_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)


@pytest_asyncio.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Create default tenant
    async with TestSessionLocal() as db:
        tenant = Tenant(id=DEFAULT_TENANT_ID, name="Test Tenant", tier="community")
        db.add(tenant)
        await db.commit()
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """AsyncClient with test DB injected via dependency override."""
    from app.database.connection import get_db
    from app.main import app

    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    # Disable lifespan to avoid background tasks + migrations in tests
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()
