import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import User, Journey
from .ai_engine.deviation import check_route_deviation

@csrf_exempt
def start_journey(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Create a mock user if one doesn't exist (useful for hackathon prototyping)
            user, created = User.objects.get_or_create(
                email=data.get('email', 'test@example.com'),
                defaults={'name': 'Naveen User', 'parent_phone': '+919876543210'}
            )
            
            journey = Journey.objects.create(
                user=user,
                start_lat=data['start_lat'],
                start_lng=data['start_lng'],
                dest_lat=data['dest_lat'],
                dest_lng=data['dest_lng']
            )
            
            return JsonResponse({"message": "Journey started", "journey_id": journey.id}, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def update_location(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            current_lat = data.get('lat')
            current_lng = data.get('lng')
            journey_id = data.get('journey_id')
            speed = data.get('speed', 0)

            # --- AI LOGIC INTEGRATION HERE ---
            # Call your Python deviation script
            is_deviated, reason = check_route_deviation(current_lat, current_lng, speed)
            
            if is_deviated:
                return JsonResponse({"status": "warning", "prompt_user": True, "reason": reason}, status=200)
            
            return JsonResponse({"status": "safe", "prompt_user": False}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def trigger_sos(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        journey_id = data.get('journey_id')
        
        # 1. Update database status
        if journey_id:
            Journey.objects.filter(id=journey_id).update(status='emergency')
            
        # 2. Add your Twilio or WhatsApp API trigger here to notify the parent
        
        return JsonResponse({"message": "Emergency alerts dispatched"}, status=200)

@csrf_exempt
def get_latest_journey(request):
    if request.method == 'GET':
        try:
            # For the hackathon, we just grab the most recently created journey
            journey = Journey.objects.last()
            
            if not journey:
                return JsonResponse({"message": "No active journeys"}, status=404)
                
            return JsonResponse({
                "id": journey.id,
                "user_name": journey.user.name,
                "user_phone": journey.user.parent_phone,
                "start_lat": journey.start_lat,
                "start_lng": journey.start_lng,
                "current_lat": journey.start_lat, # In a full app, you'd track live_lat/live_lng separately
                "current_lng": journey.start_lng,
                "status": journey.status,
                "start_time": journey.start_time.isoformat()
            }, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)