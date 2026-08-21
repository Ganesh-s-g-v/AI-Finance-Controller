import time
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.models.common import ApiResponse, ErrorDetail, ValidationErrorItem
from app.routers import (
    upload_router,
    reconciliation_router,
    dashboard_router,
    exceptions_router,
    reports_router,
)


def create_app() -> FastAPI:
    """FastAPI Application Factory."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="AI-Assisted Reconciliation Copilot API for Chartered Accountants",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Request processing time middleware
    @app.middleware("http")
    async def add_process_time_header(request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time-Sec"] = f"{process_time:.4f}"
        return response

    # Global Validation Error Handler (returns typed error JSON)
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        details = []
        for error in exc.errors():
            loc = " -> ".join([str(x) for x in error.get("loc", [])])
            details.append(
                ValidationErrorItem(
                    field=loc,
                    error=error.get("msg", "Invalid value"),
                )
            )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=ApiResponse(
                success=False,
                error=ErrorDetail(
                    code="VALIDATION_ERROR",
                    message="Request validation failed",
                    details=details,
                ),
            ).model_dump(mode="json"),
        )

    # Health Check endpoint
    @app.get("/health", tags=["Health"])
    async def health_check():
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
        }

    # Register API v1 Routers
    api_prefix = "/api/v1"
    app.include_router(upload_router, prefix=api_prefix)
    app.include_router(reconciliation_router, prefix=api_prefix)
    app.include_router(dashboard_router, prefix=api_prefix)
    app.include_router(exceptions_router, prefix=api_prefix)
    app.include_router(reports_router, prefix=api_prefix)

    return app


app = create_app()
