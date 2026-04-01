from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SalesVista API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "SalesVista API is running"}

# Include routers
from .routes import upload, forecast, metrics
app.include_router(upload.router)
app.include_router(forecast.router)
app.include_router(metrics.router)
