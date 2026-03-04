from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.ingestion.processor import process_message
from app.ingestion.schema import IngestPayload
from app.license.feature_gate import require_feature

router = APIRouter(prefix="/ingest", tags=["ingestion"])


@router.post("")
async def ingest(
    payload: IngestPayload,
    db: AsyncSession = Depends(get_db),
    _: None = require_feature("ingest"),
):
    record = await process_message(payload, db)
    return {"status": "ok", "id": str(record.id)}
