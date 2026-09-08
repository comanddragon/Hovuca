"""
Custom DRF exception handler.
Registered in settings: REST_FRAMEWORK["EXCEPTION_HANDLER"]

Normalises all error responses to a consistent envelope:
{
    "status": "error",
    "code": <http_status_int>,
    "message": "<human-readable summary>",
    "errors": { <field>: [<detail>, ...] } | null
}
"""

import logging

from django.core.exceptions import (
    PermissionDenied,
    ValidationError as DjangoValidationError,
)
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Call DRF's default handler first to get a Response object, then
    reformat it into the standard HOVUCA error envelope.
    """
    # Convert Django native exceptions to DRF equivalents
    if isinstance(exc, Http404):
        from rest_framework.exceptions import NotFound

        exc = NotFound()
    elif isinstance(exc, PermissionDenied):
        from rest_framework.exceptions import PermissionDenied as DRFPermissionDenied

        exc = DRFPermissionDenied()
    elif isinstance(exc, DjangoValidationError):
        from rest_framework.exceptions import ValidationError

        exc = ValidationError(
            detail=exc.message_dict if hasattr(exc, "message_dict") else exc.messages
        )

    response = drf_exception_handler(exc, context)

    if response is None:
        # Unhandled exception — log it and return a generic 500
        logger.exception(
            "Unhandled exception in %s: %s",
            context.get("view", "unknown view"),
            exc,
        )
        return Response(
            {
                "status": "error",
                "code": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "message": "An unexpected error occurred. Please try again later.",
                "errors": None,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Normalise the response data
    original_data = response.data
    errors = None
    message = "An error occurred."

    if isinstance(original_data, dict):
        # ValidationError with field-level errors
        if "detail" in original_data:
            message = str(original_data["detail"])
        else:
            # Field validation errors
            errors = {
                field: [str(e) for e in (errs if isinstance(errs, list) else [errs])]
                for field, errs in original_data.items()
            }
            # Build a human-readable summary
            first_field = next(iter(errors))
            first_msg = (
                errors[first_field][0] if errors[first_field] else "Invalid value."
            )
            message = (
                f"{first_field}: {first_msg}"
                if first_field != "non_field_errors"
                else first_msg
            )

    elif isinstance(original_data, list):
        errors = {"non_field_errors": [str(e) for e in original_data]}
        message = (
            errors["non_field_errors"][0]
            if errors["non_field_errors"]
            else "Validation error."
        )
    elif isinstance(original_data, str):
        message = original_data

    response.data = {
        "status": "error",
        "code": response.status_code,
        "message": message,
        "errors": errors,
    }

    return response
