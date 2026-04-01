import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    print("Testing imports...")
    from app.routes import upload, forecast, metrics
    print("✅ Routes imported successfully")
    
    print("Upload router prefix:", upload.router.prefix)
    print("Forecast router prefix:", forecast.router.prefix) 
    print("Metrics router prefix:", metrics.router.prefix)
    
    print("Upload routes:")
    for route in upload.router.routes:
        print(f"  {route.methods} {route.path}")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
