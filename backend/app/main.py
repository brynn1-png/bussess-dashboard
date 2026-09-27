"""FastAPI application factory."""

from fastapi import FastAPI
from fastapi.requests import Request
from fastapi.responses import JSONResponse

from app.api.auth import router as auth_router
from app.api.routes import router as api_router
from app.core.config import ConfigurationError, settings


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, debug=settings.debug)

    @app.exception_handler(ConfigurationError)
    def configuration_error_handler(
        request: Request, exc: ConfigurationError
    ) -> JSONResponse:
        # Missing configuration: clear, non-sensitive feedback instead of a bare 500.
        return JSONResponse(status_code=503, content={"detail": str(exc)})

    app.include_router(api_router)
    app.include_router(auth_router)
    return app


app = create_app()
