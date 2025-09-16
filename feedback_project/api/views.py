# api/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import FeedbackSerializer
from .models import Feedback
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
@api_view(['GET', 'POST'])
def feedback_list_create(request):
    """
    GET: list latest 20 feedbacks
    POST: create new feedback
    """
    if request.method == 'GET':
        qs = Feedback.objects.all().order_by('-created_at')[:20]
        serializer = FeedbackSerializer(qs, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        serializer = FeedbackSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
