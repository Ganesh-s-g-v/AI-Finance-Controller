import time
from app.routers.copilot import router as copilot_router
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.database import init_db
from app.models.common import ApiResponse, ErrorDetail, ValidationErrorItem
from app.routers import (
    upload_router,
    reconciliation_router,
    dashboard_router,
    exceptions_router,
    reports_router,
    auth_router,
    companies_router,
)

from app.routers.copilot import router as copilot_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context: initialize database tables and seed accounts."""
    init_db()
    yield


def create_app() -> FastAPI:
    """FastAPI Application Factory."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="AI-Assisted Reconciliation Copilot API for Chartered Accountants and Financial Controllers",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
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

    # Root endpoint (Landing page & API discovery)
    @app.get("/", tags=["System"])
    async def root(request: Request):
        accept = request.headers.get("accept", "")
        if "text/html" in accept:
            from fastapi.responses import HTMLResponse
            html_content = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>{settings.APP_NAME} - Backend API</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    * {{ margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }}
                    body {{ background: #0B0F19; color: #F8FAFC; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }}
                    .card {{ background: #111827; border: 1px solid #1F2937; border-radius: 16px; padding: 36px; max-width: 580px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }}
                    .badge {{ display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); color: #10B981; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }}
                    .pulse {{ width: 8px; height: 8px; background: #10B981; border-radius: 50%; box-shadow: 0 0 10px #10B981; }}
                    h1 {{ font-size: 24px; font-weight: 700; color: #FFFFFF; margin-bottom: 8px; }}
                    p {{ color: #94A3B8; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }}
                    .actions {{ display: flex; flex-direction: column; gap: 12px; }}
                    .btn {{ display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; transition: all 0.2s ease; }}
                    .btn-primary {{ background: #6366F1; color: #FFFFFF; }}
                    .btn-primary:hover {{ background: #4F46E5; transform: translateY(-1px); }}
                    .btn-secondary {{ background: #1F2937; color: #E2E8F0; border: 1px solid #374151; }}
                    .btn-secondary:hover {{ background: #374151; color: #FFFFFF; transform: translateY(-1px); }}
                    .footer {{ margin-top: 24px; pt: 16px; border-top: 1px solid #1F2937; display: flex; justify-content: space-between; font-size: 12px; color: #64748B; }}
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="badge"><span class="pulse"></span> Backend Running (v{settings.APP_VERSION})</div>
                    <h1>AI Finance Controller API</h1>
                    <p>The backend server is online and operational. To access the user interface dashboard or the interactive Swagger API documentation, use the links below:</p>
                    <div class="actions">
                        <a href="http://localhost:5173" class="btn btn-primary" target="_blank">
                            <span>Open Web App (Frontend UI)</span>
                            <span>http://localhost:5173 &rarr;</span>
                        </a>
                        <a href="/docs" class="btn btn-secondary">
                            <span>Interactive Swagger API Docs</span>
                            <span>/docs &rarr;</span>
                        </a>
                        <a href="/health" class="btn btn-secondary">
                            <span>Health Check</span>
                            <span>/health &rarr;</span>
                        </a>
                    </div>
                    <div class="footer">
                        <span>Environment: {settings.ENVIRONMENT}</span>
                        <span>API Prefix: /api/v1</span>
                    </div>
                </div>
            </body>
            </html>
            """
            return HTMLResponse(content=html_content)
        return {
            "status": "online",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "frontend_url": "http://localhost:5173",
            "docs_url": "/docs",
            "health_url": "/health",
            "api_prefix": "/api/v1",
        }

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
    app.include_router(auth_router, prefix=api_prefix)
    app.include_router(companies_router, prefix=api_prefix)
    app.include_router(upload_router, prefix=api_prefix)
    app.include_router(reconciliation_router, prefix=api_prefix)
    app.include_router(dashboard_router, prefix=api_prefix)
    app.include_router(exceptions_router, prefix=api_prefix)
    app.include_router(reports_router, prefix=api_prefix)
    app.include_router(copilot_router, prefix=api_prefix)
    
    return app


app = create_app()
