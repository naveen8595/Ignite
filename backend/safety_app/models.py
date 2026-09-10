from django.db import models

class User(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    parent_phone = models.CharField(max_length=20)
    
    def __str__(self):
        return self.name

class Journey(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('emergency', 'Emergency'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='journeys')
    start_lat = models.FloatField()
    start_lng = models.FloatField()
    dest_lat = models.FloatField()
    dest_lng = models.FloatField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    start_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Journey {self.id} for {self.user.name}"