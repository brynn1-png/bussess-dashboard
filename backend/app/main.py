"""FastAPI application factory."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.requests import Request
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles

from app.api.admin import router as admin_router
from app.api.auth import router as auth_router
from app.api.routes import router as api_router
from app.api.tickets import router as tickets_router
from app.api.workflows import router as workflows_router
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
    app.include_router(tickets_router)
    app.include_router(admin_router)
    app.include_router(workflows_router)

    # Registered last on purpose: every /api route above is matched first, so
    # the catch-all only ever sees client-side routes.
    _mount_spa(app, Path(settings.static_dir))
    return app


def _mount_spa(app: FastAPI, static_dir: Path) -> None:
    """Serve the built SPA from this process, so deploys need a single origin.

    The frontend uses BrowserRouter with a relative API base ("/api"), which
    means the browser treats the app and the API as one host. Mounting the build
    output here satisfies that without CORS or a build-time API URL.

    No-op when the directory is absent, which is the case in dev (Vite serves
    the app) and in tests.
    """
    index = static_dir / "index.html"
    if not index.is_file():
        return

    assets = static_dir / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    root = static_dir.resolve()

    @app.api_route(
        "/{spa_path:path}",
        methods=["GET", "HEAD"],
        include_in_schema=False,
    )
    def spa(spa_path: str) -> Response:
        # An unmatched /api/* path is a genuine 404 - never the SPA shell, or a
        # typo'd endpoint would return 200 with HTML.
        if spa_path == "api" or spa_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})

        # Serve a real file at the build root when one exists (favicon, robots.txt).
        candidate = (root / spa_path).resolve()
        if candidate.is_file() and root in candidate.parents:
            return FileResponse(candidate)

        # Everything else is a client-side route: hand back the shell so a
        # deep link or a browser refresh on /admin/tickets works.
        return FileResponse(index)


app = create_app()
