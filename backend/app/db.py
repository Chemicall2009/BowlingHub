"""
@file app/db.py
@description SQLModel database connection and session management.
"""

from sqlmodel import SQLModel, create_engine, Session
from app.config import settings

sqlite_url = settings.database_url
connect_args = {"check_same_thread": False} if "sqlite" in sqlite_url else {}

engine = create_engine(sqlite_url, echo=False, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
