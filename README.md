# SalesVista – AI Sales Forecasting SaaS
**Future Interns ML Task 1** | Real Kaggle Superstore Dataset

Full-stack production-grade forecasting app built with:
- **Backend**: FastAPI + Prophet (multiplicative seasonality + confidence intervals)
- **Frontend**: Next.js 14 + Tailwind + Recharts (beautiful dark UI)
- **DevOps**: Docker + docker-compose

### Features
- Upload any sales CSV → instant Prophet training
- Interactive 30-day forecast with 95% confidence bands
- Real business metrics (MAE, RMSE, MAPE)

### How to run locally
```bash
docker compose up --build