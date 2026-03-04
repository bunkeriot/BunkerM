from fastapi import Depends, HTTPException

from app.license.validator import Tier, get_tier, tier_gte

FEATURE_TIERS: dict[str, Tier] = {
    "metrics": Tier.community,
    "anomalies": Tier.community,
    "alerts": Tier.community,
    "ingest": Tier.community,
    "llm_assistant": Tier.pro,
    "reports": Tier.pro,
    "behavioral_security": Tier.enterprise,
    "acl_generator": Tier.enterprise,
}


def require_feature(feature: str):
    def _check():
        required = FEATURE_TIERS.get(feature, Tier.enterprise_plus)
        current = get_tier()
        if not tier_gte(current, required):
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "feature_requires_upgrade",
                    "feature": feature,
                    "required_tier": required.value,
                    "current_tier": current.value,
                    "upgrade_url": "https://bunkerm.io/pricing",
                },
            )

    return Depends(_check)
