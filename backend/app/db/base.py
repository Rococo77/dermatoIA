from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from app.core.config import settings

# Async engine (asyncpg) - pour les operations I/O-bound classiques
async_engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG)
async_session_factory = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

# Sync engine (psycopg2) - pour les operations executees dans un thread pool
# (inference IA + persistance dans le meme thread, evite les conflits event loop)
sync_engine = create_engine(settings.DATABASE_URL_SYNC, echo=settings.DEBUG, pool_size=5, max_overflow=10)
sync_session_factory = sessionmaker(sync_engine, class_=Session, expire_on_commit=False)


class Base(DeclarativeBase):
    pass
