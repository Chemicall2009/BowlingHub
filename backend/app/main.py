/**
 * @file app/main.py
 * @description FastAPI application entry point with lifespan, routers, static mount, and ListenParserService integration.
 */

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import structlog
import os

from app.config import settings
from app.db import create_db_and_tables
from app.logging_config import setup_logging
from app.api import lanes, games, cameras, calibration, emulator, sniffer, settings as settings_api, logs
from app.ws import router as ws_router
from app.services.listen_parser import ListenParserService
from app.transport.serial_transport import SerialTransport
from app.transport.tcp_transport import TCPTransport
from app.transport.mock_transport import MockTransport

setup_logging()
logger = structlog.get_logger(__name__)

listen_parser: ListenParserService | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global listen_parser
    logger.info("Starting Bowling Backend", mode=settings.operation_mode)
    create_db_and_tables()
    app.state.settings = settings

    # Ensure static snapshots dir
    os.makedirs(settings.snapshots_dir, exist_ok=True)

    # Start ListenParserService if tv_enabled and listen_only_enabled
    if settings.tv_enabled and settings.listen_only_enabled:
        try:
            if settings.transport == "serial":
                listener_transport = SerialTransport(listen_only=True)
            elif settings.transport == "tcp":
                listener_transport = TCPTransport(listen_only=True)
            else:
                listener_transport = MockTransport(listen_only=True)

            listen_parser = ListenParserService(listener_transport)
            await listen_parser.start()
            logger.info("ListenParserService started successfully.")
        except Exception as e:
            logger.error(f"Failed to start ListenParserService: {e}")

    yield

    if listen_parser:
        await listen_parser.stop()
    logger.info("Shutting down Bowling Backend")

app = FastAPI(
    title="Bowling Club Management System API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for snapshots
app.mount("/static", StaticFiles(directory=settings.static_dir), name="static")

# Include API Routers
app.include_router(lanes.router, prefix="/api")
app.include_router(games.router, prefix="/api")
app.include_router(cameras.router, prefix="/api")
app.include_router(calibration.router, prefix="/api")
app.include_router(emulator.router, prefix="/api")
app.include_router(sniffer.router, prefix="/api")
app.include_router(settings_api.router, prefix="/api")
app.include_router(logs.router, prefix="/api")

# WebSocket Router
app.include_router(ws_router.router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "type": "about:blank",
            "title": "Internal Server Error",
            "status": 500,
            "detail": str(exc),
            "instance": request.url.path,
        },
    )

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "mode": settings.operation_mode,
        "transport": settings.transport,
        "listen_only": settings.listen_only_enabled,
        "tv_enabled": settings.tv_enabled,
    }
