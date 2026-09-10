def check_route_deviation(current_lat, current_lng, speed):
    """
    Analyzes user location and speed to detect unusual behavior.
    For the hackathon demo, we trigger an alert if speed is 0 (inactivity).
    """
    try:
        speed_float = float(speed)
        
        # Simulated AI Logic: Detect prolonged inactivity
        # In a real app, you would check if speed == 0 for X minutes using timestamps
        if speed_float <= 0.5: # Less than 0.5 m/s indicates stopping
            return True, "Prolonged inactivity detected. You haven't moved recently."
            
        # Here you would also add Geofencing logic to check if they left the route path
        
        return False, "Route normal"
        
    except ValueError:
        return False, "Invalid telemetry data"