import logging
import traceback

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


logger = logging.getLogger(__name__)


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        return response
    logger.error("Unhandled API error", exc_info=(type(exc), exc, exc.__traceback__))
    traceback.print_exception(type(exc), exc, exc.__traceback__)
    return Response(
        {"error": "Something went wrong. Please try again.", "code": "INTERNAL_SERVER_ERROR"},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
