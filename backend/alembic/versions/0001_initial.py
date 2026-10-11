"""initial migration

Revision ID: 0001_initial
Revises: 
Create Date: 2026-10-11 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import sqlmodel

revision: str = '0001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('lanes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('number', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('last_seen_at', sa.DateTime(), nullable=True),
        sa.Column('mode', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('cameras',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('mode', sa.String(), nullable=False),
        sa.Column('lane_ids', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('last_seen_at', sa.DateTime(), nullable=True),
        sa.Column('last_status_payload', sa.JSON(), nullable=True),
        sa.Column('version', sa.String(), nullable=True),
        sa.Column('ip', sa.String(), nullable=True),
        sa.Column('wifi_rssi', sa.Integer(), nullable=True),
        sa.Column('uptime_sec', sa.Integer(), nullable=True),
        sa.Column('reset_reason', sa.String(), nullable=True),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('data_mode', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('calibration_profiles',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('camera_id', sa.String(), nullable=False),
        sa.Column('lane_id', sa.Integer(), nullable=False),
        sa.Column('camera_type', sa.String(), nullable=False),
        sa.Column('polygon_roi', sa.JSON(), nullable=True),
        sa.Column('pin_positions', sa.JSON(), nullable=True),
        sa.Column('reference_frame_url', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('data_mode', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('command_logs',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('direction', sa.String(), nullable=False),
        sa.Column('lane_id', sa.Integer(), nullable=True),
        sa.Column('cmd', sa.Integer(), nullable=True),
        sa.Column('cmd_name', sa.String(), nullable=True),
        sa.Column('dry_run', sa.Boolean(), nullable=False),
        sa.Column('raw_hex', sa.String(), nullable=False),
        sa.Column('response_hex', sa.String(), nullable=True),
        sa.Column('checksum_ok', sa.Boolean(), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=False),
        sa.Column('error', sa.String(), nullable=True),
        sa.Column('source', sa.String(), nullable=False),
        sa.Column('data_mode', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('mqtt_logs',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('topic', sa.String(), nullable=False),
        sa.Column('direction', sa.String(), nullable=False),
        sa.Column('payload_preview', sa.String(), nullable=False),
        sa.Column('payload_size', sa.Integer(), nullable=False),
        sa.Column('qos', sa.Integer(), nullable=False),
        sa.Column('retained', sa.Boolean(), nullable=False),
        sa.Column('camera_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('transport', sa.String(), nullable=False),
        sa.Column('serial_port', sa.String(), nullable=True),
        sa.Column('serial_baud', sa.Integer(), nullable=False),
        sa.Column('tcp_host', sa.String(), nullable=True),
        sa.Column('tcp_port', sa.Integer(), nullable=True),
        sa.Column('xor_mask_hex', sa.String(), nullable=False),
        sa.Column('checksum_variant', sa.String(), nullable=False),
        sa.Column('frame_length', sa.Integer(), nullable=False),
        sa.Column('lanes_count', sa.Integer(), nullable=False),
        sa.Column('lanes_start_number', sa.Integer(), nullable=False),
        sa.Column('poll_interval_ms', sa.Integer(), nullable=False),
        sa.Column('poll_timeout_ms', sa.Integer(), nullable=False),
        sa.Column('inter_packet_delay_ms', sa.Integer(), nullable=False),
        sa.Column('auto_baud_switch', sa.Boolean(), nullable=False),
        sa.Column('mqtt_host', sa.String(), nullable=False),
        sa.Column('mqtt_port', sa.Integer(), nullable=False),
        sa.Column('mqtt_user', sa.String(), nullable=True),
        sa.Column('mqtt_pass', sa.String(), nullable=True),
        sa.Column('mqtt_client_id', sa.String(), nullable=False),
        sa.Column('mqtt_enabled', sa.Boolean(), nullable=False),
        sa.Column('operation_mode', sa.String(), nullable=False),
        sa.Column('last_mode_switch_at', sa.DateTime(), nullable=True),
        sa.Column('last_mode_switch_by', sa.String(), nullable=True),
        sa.Column('notifications', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('games',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('lane_id', sa.Integer(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('finished_at', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('mode', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['lane_id'], ['lanes.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('snapshots',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('camera_id', sa.String(), nullable=False),
        sa.Column('lane_id', sa.Integer(), nullable=False),
        sa.Column('captured_at', sa.DateTime(), nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('width', sa.Integer(), nullable=False),
        sa.Column('height', sa.Integer(), nullable=False),
        sa.Column('jpeg_quality', sa.Integer(), nullable=False),
        sa.Column('triggered_by', sa.String(), nullable=False),
        sa.Column('request_id', sa.String(), nullable=True),
        sa.Column('data_mode', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['camera_id'], ['cameras.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('players',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('game_id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('final_score', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['game_id'], ['games.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('shots',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('game_id', sa.Uuid(), nullable=False),
        sa.Column('player_id', sa.Uuid(), nullable=False),
        sa.Column('frame_number', sa.Integer(), nullable=False),
        sa.Column('shot_number', sa.Integer(), nullable=False),
        sa.Column('pins_down', sa.Integer(), nullable=False),
        sa.Column('pins_state', sa.JSON(), nullable=True),
        sa.Column('data_mode', sa.String(), nullable=True),
        sa.Column('is_foul', sa.Boolean(), nullable=False),
        sa.Column('is_split', sa.Boolean(), nullable=False),
        sa.Column('ball_speed', sa.Integer(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['game_id'], ['games.id'], ),
        sa.ForeignKeyConstraint(['player_id'], ['players.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('shots')
    op.drop_table('players')
    op.drop_table('snapshots')
    op.drop_table('games')
    op.drop_table('settings')
    op.drop_table('mqtt_logs')
    op.drop_table('command_logs')
    op.drop_table('calibration_profiles')
    op.drop_table('cameras')
    op.drop_table('lanes')
