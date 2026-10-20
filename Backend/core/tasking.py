"""Compatibility adapter backed by Django 6's Tasks framework."""

from functools import wraps

from django.tasks import task


class _TaskContext:
    """Preserve the old ``self.retry(exc=...)`` behavior for immediate tasks."""

    @staticmethod
    def retry(*, exc):
        raise exc


def shared_task(*decorator_args, **options):
    """Convert the project's legacy task decorators to Django tasks.

    Legacy decorator options are accepted while the resulting
    object is a native Django ``Task`` exposing ``enqueue``.
    """

    bind = options.pop("bind", False)
    queue_name = options.pop("queue", "default")
    options.pop("name", None)
    options.pop("max_retries", None)
    options.pop("default_retry_delay", None)

    def decorate(function):
        if bind:
            @wraps(function)
            def runnable(*args, **kwargs):
                return function(_TaskContext(), *args, **kwargs)
        else:
            runnable = function

        django_task = task(queue_name=queue_name)(runnable)
        return django_task

    if decorator_args and callable(decorator_args[0]):
        return decorate(decorator_args[0])
    return decorate
