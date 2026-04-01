from fastapi import APIRouter, HTTPException
import joblib
import pandas as pd
import numpy as np
from datetime import datetime

router = APIRouter(prefix="/api", tags=["metrics"])

MODEL_PATH = "app/model/prophet_model.pkl"

@router.get("/metrics")
async def get_metrics():
    """Get model performance metrics"""
    try:
        if not joblib.exists(MODEL_PATH):
            raise HTTPException(
                status_code=400, 
                detail="No trained model found. Please upload data first."
            )
        
        model_data = joblib.load(MODEL_PATH)
        metrics = model_data.get('metrics', {})
        training_info = model_data.get('training_info', {})
        
        return {
            "success": True,
            "model_performance": {
                "MAE": metrics.get('MAE', 0),
                "RMSE": metrics.get('RMSE', 0), 
                "MAPE": f"{metrics.get('MAPE', 0)}%"
            },
            "training_info": training_info,
            "model_quality": {
                "accuracy_score": max(0, 100 - metrics.get('MAPE', 0)),
                "reliability": "High" if metrics.get('MAPE', 100) < 10 else "Medium",
                "data_quality": "Good" if training_info.get('days_trained', 0) > 100 else "Limited"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving metrics: {str(e)}")

@router.get("/analytics")
async def get_analytics():
    """Get detailed analytics and insights"""
    try:
        if not joblib.exists(MODEL_PATH):
            raise HTTPException(
                status_code=400, 
                detail="No trained model found. Please upload data first."
            )
        
        model_data = joblib.load(MODEL_PATH)
        model = model_data['model']
        training_info = model_data.get('training_info', {})
        
        # Load training data for analysis
        try:
            df = pd.read_csv("app/data/training_data.csv")
            df['ds'] = pd.to_datetime(df['ds'])
            
            # Analyze patterns
            df['day_of_week'] = df['ds'].dt.day_name()
            df['month'] = df['ds'].dt.month
            df['year'] = df['ds'].dt.year
            
            # Weekly patterns
            weekly_avg = df.groupby('day_of_week')['y'].mean().to_dict()
            
            # Monthly patterns  
            monthly_avg = df.groupby('month')['y'].mean().to_dict()
            
            # Year over year growth
            if len(df['year'].unique()) > 1:
                yearly_totals = df.groupby('year')['y'].sum()
                yoy_growth = []
                for i in range(1, len(yearly_totals)):
                    prev_year = yearly_totals.iloc[i-1]
                    curr_year = yearly_totals.iloc[i]
                    growth = ((curr_year - prev_year) / prev_year) * 100
                    yoy_growth.append({
                        "year": yearly_totals.index[i],
                        "growth_rate": round(growth, 2)
                    })
            else:
                yoy_growth = []
            
            return {
                "success": True,
                "patterns": {
                    "weekly_average": {k: round(v, 2) for k, v in weekly_avg.items()},
                    "monthly_average": {k: round(v, 2) for k, v in monthly_avg.items()},
                    "best_day": max(weekly_avg, key=weekly_avg.get),
                    "worst_day": min(weekly_avg, key=weekly_avg.get),
                    "best_month": max(monthly_avg, key=monthly_avg.get),
                    "worst_month": min(monthly_avg, key=monthly_avg.get)
                },
                "year_over_year_growth": yoy_growth,
                "data_summary": {
                    "total_days": len(df),
                    "total_sales": round(df['y'].sum(), 2),
                    "average_daily_sales": round(df['y'].mean(), 2),
                    "sales_volatility": round(df['y'].std() / df['y'].mean() * 100, 2),
                    "date_range": f"{df['ds'].min().date()} → {df['ds'].max().date()}"
                },
                "insights": generate_insights(df, weekly_avg, monthly_avg)
            }
            
        except FileNotFoundError:
            return {
                "success": True,
                "message": "Training data not found for detailed analysis",
                "model_metrics": model_data.get('metrics', {})
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating analytics: {str(e)}")

def generate_insights(df, weekly_avg, monthly_avg):
    """Generate business insights from data analysis"""
    insights = []
    
    # Weekend effect
    weekend_avg = (weekly_avg.get('Saturday', 0) + weekly_avg.get('Sunday', 0)) / 2
    weekday_avg = np.mean([v for k, v in weekly_avg.items() if k not in ['Saturday', 'Sunday']])
    if weekend_avg > weekday_avg * 1.2:
        insights.append("🎯 Strong weekend sales pattern detected")
    elif weekend_avg < weekday_avg * 0.8:
        insights.append("📉 Weekday sales outperform weekends")
    
    # Seasonality
    summer_months = [6, 7, 8]
    winter_months = [12, 1, 2]
    summer_avg = np.mean([monthly_avg.get(m, 0) for m in summer_months])
    winter_avg = np.mean([monthly_avg.get(m, 0) for m in winter_months])
    
    if summer_avg > winter_avg * 1.3:
        insights.append("☀️ Summer season shows strong performance")
    elif winter_avg > summer_avg * 1.3:
        insights.append("❄️ Winter season drives higher sales")
    
    # Growth trend
    if len(df) > 30:
        recent_avg = df.tail(30)['y'].mean()
        earlier_avg = df.head(30)['y'].mean()
        if recent_avg > earlier_avg * 1.1:
            insights.append("📈 Recent sales show upward trend")
        elif recent_avg < earlier_avg * 0.9:
            insights.append("📉 Recent sales show declining trend")
    
    # Volatility
    volatility = df['y'].std() / df['y'].mean()
    if volatility > 0.5:
        insights.append("⚠️ High sales volatility detected")
    elif volatility < 0.2:
        insights.append("💰 Sales patterns are very stable")
    
    return insights

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    model_exists = joblib.exists(MODEL_PATH)
    data_exists = pd.io.common.file_exists("app/data/training_data.csv")
    
    status = {
        "status": "healthy",
        "model_ready": model_exists,
        "data_ready": data_exists,
        "timestamp": datetime.now().isoformat()
    }
    
    if not model_exists:
        status["status"] = "model_not_trained"
    elif not data_exists:
        status["status"] = "data_not_loaded"
    
    return status
