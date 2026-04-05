import uuid
from datetime import datetime, timedelta, timezone


class AlertRateLimiter:
    """In-memory deduplication: one alert per (tenant_id, entity_id, anomaly_type) per cooldown window."""

    def __init__(self) -> None:
        self._last_alert: dict[tuple, datetime] = {}

    def should_alert(
        self,
        tenant_id: uuid.UUID,
        entity_id: str,
        anomaly_type: str,
        cooldown_minutes: int = 5,
    ) -> bool:
        key = (tenant_id, entity_id, anomaly_type)
        now = datetime.now(timezone.utc)
        last = self._last_alert.get(key)
        if last and (now - last) < timedelta(minutes=cooldown_minutes):
            return False
        self._last_alert[key] = now
        return True

    def reset(self) -> None:
        self._last_alert.clear()


# Module-level singleton
rate_limiter = AlertRateLimiter()
