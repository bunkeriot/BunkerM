from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
    )

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
