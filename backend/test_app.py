import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    print("Creating FastAPI app...")
    from app.main import app
    print(" App created successfully")
    
    print("Available routes:")
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            print(f"  {route.methods} {route.path}")
            
except Exception as e:
    print(f" Error: {e}")
    import traceback
    traceback.print_exc()
