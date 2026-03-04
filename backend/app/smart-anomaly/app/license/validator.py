from enum import Enum


class Tier(str, Enum):
    community = "community"
    pro = "pro"
    enterprise = "enterprise"
    enterprise_plus = "enterprise_plus"


_TIER_ORDER = [Tier.community, Tier.pro, Tier.enterprise, Tier.enterprise_plus]


def get_tier() -> Tier:
    from app.config import settings
    try:
        return Tier(settings.TIER.lower())
    except ValueError:
        return Tier.community


def tier_gte(a: Tier, b: Tier) -> bool:
    """Return True if tier a >= tier b."""
    return _TIER_ORDER.index(a) >= _TIER_ORDER.index(b)
