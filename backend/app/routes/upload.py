from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
from prophet import Prophet
import joblib
import io
import os
from datetime import datetime
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error

router = APIRouter(prefix="/api", tags=["upload"])

# Ensure model directory exists
os.makedirs("app/model", exist_ok=True)
MODEL_PATH = "app/model/prophet_model.pkl"
DATA_PATH = "app/data/training_data.csv"

@router.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        # Validate required columns
        required_cols = ['Order Date', 'Sales']
        if not all(col in df.columns for col in required_cols):
            raise HTTPException(
                status_code=400, 
                detail="CSV must contain 'Order Date' and 'Sales' columns"
            )
        
        # Clean and prepare data
        df = df.rename(columns={"Order Date": "ds", "Sales": "y"})
        df["ds"] = pd.to_datetime(df["ds"], errors='coerce')
        df = df.dropna(subset=['ds', 'y'])
        df["y"] = pd.to_numeric(df["y"], errors='coerce')
        df = df.dropna()
        
        # Remove outliers (values beyond 3 standard deviations)
        mean_sales = df['y'].mean()
        std_sales = df['y'].std()
        df = df[df['y'] <= mean_sales + 3 * std_sales]
        
        # Aggregate to daily total sales
        df = df.groupby("ds")["y"].sum().reset_index()
        df = df.sort_values("ds")
        
        # Save training data
        os.makedirs("app/data", exist_ok=True)
        df.to_csv(DATA_PATH, index=False)
        print(f"✅ Training data saved to {DATA_PATH}")
        
        print(f"✅ Loaded {len(df)} days of cleaned sales data")
        print(f"📊 Date range: {df['ds'].min().date()} → {df['ds'].max().date()}")
        print(f"💰 Sales range: ${df['y'].min():.2f} → ${df['y'].max():.2f}")
        
        # Advanced Prophet model with hyperparameters
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            seasonality_mode="multiplicative",
            changepoint_prior_scale=0.05,
            seasonality_prior_scale=10.0,
            holidays_prior_scale=10.0,
            mcmc_samples=0,
            interval_width=0.95,
            uncertainty_samples=1000
        )
        
        # Add custom seasonality for better accuracy
        model.add_seasonality(name='monthly', period=30.5, fourier_order=8)
        model.add_seasonality(name='quarterly', period=91.25, fourier_order=5)
        
        # Fit model
        model.fit(df)
        
        # Calculate training metrics
        train_forecast = model.predict(df)
        mae = mean_absolute_error(df['y'], train_forecast['yhat'])
        rmse = np.sqrt(mean_squared_error(df['y'], train_forecast['yhat']))
        mape = np.mean(np.abs((df['y'] - train_forecast['yhat']) / df['y'])) * 100
        
        # Save model and metrics
        model_data = {
            'model': model,
            'metrics': {
                'MAE': round(mae, 2),
                'RMSE': round(rmse, 2),
                'MAPE': round(mape, 2)
            },
            'training_info': {
                'days_trained': len(df),
                'date_range': f"{df['ds'].min().date()} → {df['ds'].max().date()}",
                'sales_stats': {
                    'mean': round(df['y'].mean(), 2),
                    'median': round(df['y'].median(), 2),
                    'std': round(df['y'].std(), 2)
                }
            }
        }
        joblib.dump(model_data, MODEL_PATH)
        print(f"✅ Model saved to {MODEL_PATH}")
        
        # Verify model was saved
        if os.path.exists(MODEL_PATH):
            print(f"✅ Model file verified at {MODEL_PATH}")
        else:
            print(f"❌ Model file NOT found at {MODEL_PATH}")
        
        return {
            "success": True,
            "message": "✅ Real Kaggle Superstore data uploaded & advanced ML model trained successfully",
            "data": {
                "days_loaded": len(df),
                "date_range": f"{df['ds'].min().date()} → {df['ds'].max().date()}",
                "metrics": {
                    "MAE": round(mae, 2),
                    "RMSE": round(rmse, 2), 
                    "MAPE": f"{round(mape, 2)}%"
                },
                "sales_summary": {
                    "total_sales": round(df['y'].sum(), 2),
                    "avg_daily_sales": round(df['y'].mean(), 2),
                    "max_daily_sales": round(df['y'].max(), 2)
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.get("/training-status")
async def get_training_status():
    """Check if model is trained and ready"""
    if os.path.exists(MODEL_PATH):
        try:
            model_data = joblib.load(MODEL_PATH)
            return {
                "trained": True,
                "metrics": model_data.get('metrics', {}),
                "training_info": model_data.get('training_info', {})
            }
        except:
            return {"trained": False, "message": "Model file corrupted"}
    return {"trained": False, "message": "No trained model found"}
