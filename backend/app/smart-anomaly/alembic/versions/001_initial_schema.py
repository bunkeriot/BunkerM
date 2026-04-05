"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-03-03 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tenants",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("tier", sa.String(50), nullable=False, server_default="community"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "message_metadata",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.String(512), nullable=False),
        sa.Column("topic", sa.String(512), nullable=False),
        sa.Column("client_id", sa.String(255), nullable=False, server_default=""),
        sa.Column("timestamp", sa.DateTime(), nullable=False),
        sa.Column("qos", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("retain", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("raw_value", sa.Text(), nullable=False, server_default=""),
        sa.Column("numeric_fields", JSONB(), nullable=False, server_default="{}"),
        sa.Column("metadata", JSONB(), nullable=False, server_default="{}"),
    )
    op.create_index("ix_msg_tenant_entity_ts", "message_metadata", ["tenant_id", "entity_id", "timestamp"])
    op.create_index("ix_msg_entity_type", "message_metadata", ["entity_type"])

    op.create_table(
        "metrics_aggregates",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.String(512), nullable=False),
        sa.Column("window", sa.String(10), nullable=False),
        sa.Column("field_name", sa.String(255), nullable=False),
        sa.Column("mean", sa.Float(), nullable=True),
        sa.Column("std", sa.Float(), nullable=True),
        sa.Column("count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("computed_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index(
        "ix_metrics_lookup",
        "metrics_aggregates",
        ["tenant_id", "entity_id", "window", "field_name"],
        unique=True,
    )

    op.create_table(
        "anomalies",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.String(512), nullable=False),
        sa.Column("anomaly_type", sa.String(50), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("details", JSONB(), nullable=False, server_default="{}"),
        sa.Column("detected_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_anomaly_tenant_entity_ts", "anomalies", ["tenant_id", "entity_id", "detected_at"])

    op.create_table(
        "alerts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("anomaly_id", UUID(as_uuid=True), sa.ForeignKey("anomalies.id"), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.String(512), nullable=False),
        sa.Column("anomaly_type", sa.String(50), nullable=False),
        sa.Column("severity", sa.String(20), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("acknowledged", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_alert_tenant_ts", "alerts", ["tenant_id", "created_at"])


def downgrade() -> None:
    op.drop_table("alerts")
    op.drop_table("anomalies")
    op.drop_table("metrics_aggregates")
    op.drop_table("message_metadata")
    op.drop_table("tenants")
