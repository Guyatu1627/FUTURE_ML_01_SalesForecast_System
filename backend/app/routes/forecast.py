from fastapi import APIRouter, HTTPException
import joblib
import pandas as pd
from datetime import datetime, timedelta
import numpy as np
import os

router = APIRouter(prefix="/api", tags=["forecast"])

MODEL_PATH = "app/model/prophet_model.pkl"

@router.get("/forecast")
async def get_forecast(days: int = 30):
    """Generate sales forecast for specified number of days"""
    try:
        print(f"🔮 Generating forecast for {days} days...")
        print(f"📁 Checking model at: {MODEL_PATH}")
        
        if not os.path.exists(MODEL_PATH):
            print(f"❌ Model file not found at {MODEL_PATH}")
            raise HTTPException(
                status_code=400, 
                detail="No trained model found. Please upload data first."
            )
        
        print("✅ Model file found, loading...")
        model_data = joblib.load(MODEL_PATH)
        model = model_data['model']
        print("✅ Model loaded successfully")
        
        # Create future dataframe
        future = model.make_future_dataframe(periods=days)
        
        # Generate forecast
        forecast = model.predict(future)
        
        # Get only future predictions
        future_forecast = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(days)
        
        # Convert to required format
        forecast_data = []
        for _, row in future_forecast.iterrows():
            forecast_data.append({
                "ds": row['ds'].strftime("%Y-%m-%d"),
                "yhat": round(float(row['yhat']), 2),
                "yhat_lower": round(float(row['yhat_lower']), 2),
                "yhat_upper": round(float(row['yhat_upper']), 2)
            })
        
        # Calculate insights
        last_actual = forecast['yhat'].iloc[-(days+1)]
        next_predicted = forecast['yhat'].iloc[-days]
        growth_rate = ((next_predicted - last_actual) / last_actual) * 100
        
        # Find potential dips
        dips = []
        for i in range(len(forecast_data)):
            if i > 0:
                prev_val = forecast_data[i-1]['yhat']
                curr_val = forecast_data[i]['yhat']
                if curr_val < prev_val * 0.9:  # 10% drop
                    dips.append({
                        "date": forecast_data[i]['ds'],
                        "drop_percentage": round(((prev_val - curr_val) / prev_val) * 100, 1)
                    })
        
        return {
            "success": True,
            "forecast": forecast_data,
            "insights": {
                "growth_rate": round(growth_rate, 1),
                "total_predicted_sales": round(sum(item['yhat'] for item in forecast_data), 2),
                "avg_daily_prediction": round(np.mean([item['yhat'] for item in forecast_data]), 2),
                "potential_dips": dips[:3],  # Top 3 potential dips
                "confidence_interval": "95%"
            },
            "model_metrics": model_data.get('metrics', {})
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating forecast: {str(e)}")

@router.get("/forecast/extended")
async def get_extended_forecast(days: int = 90):
    """Generate extended forecast with more detailed analysis"""
    try:
        if not joblib.exists(MODEL_PATH):
            raise HTTPException(
                status_code=400, 
                detail="No trained model found. Please upload data first."
            )
        
        model_data = joblib.load(MODEL_PATH)
        model = model_data['model']
        
        # Create extended future dataframe
        future = model.make_future_dataframe(periods=days)
        forecast = model.predict(future)
        
        # Get future predictions with components
        future_forecast = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper', 
                                  'trend', 'yearly', 'weekly']].tail(days)
        
        # Convert to format
        forecast_data = []
        for _, row in future_forecast.iterrows():
            forecast_data.append({
                "ds": row['ds'].strftime("%Y-%m-%d"),
                "yhat": round(float(row['yhat']), 2),
                "yhat_lower": round(float(row['yhat_lower']), 2),
                "yhat_upper": round(float(row['yhat_upper']), 2),
                "trend": round(float(row['trend']), 2),
                "yearly": round(float(row['yearly']), 2),
                "weekly": round(float(row['weekly']), 2),
                "day_of_week": row['ds'].day_name()
            })
        
        # Monthly aggregation
        monthly_data = {}
        for item in forecast_data:
            month_key = item['ds'][:7]  # YYYY-MM
            if month_key not in monthly_data:
                monthly_data[month_key] = []
            monthly_data[month_key].append(item['yhat'])
        
        monthly_summary = []
        for month, values in monthly_data.items():
            monthly_summary.append({
                "month": month,
                "total_sales": round(sum(values), 2),
                "avg_daily_sales": round(np.mean(values), 2),
                "days_in_month": len(values)
            })
        
        return {
            "success": True,
            "forecast": forecast_data,
            "monthly_summary": monthly_summary,
            "model_metrics": model_data.get('metrics', {})
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating extended forecast: {str(e)}")
