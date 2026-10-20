"""Verify that database-backed media references already exist in Cloudflare R2."""

import mimetypes
import os

import boto3
from botocore.exceptions import ClientError
from django.apps import apps
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand, CommandError
from django.db import models

REQUIRED_ENV = (
    "R2_ACCOUNT_ID",
    "R2_BUCKET_NAME",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
)


class Command(BaseCommand):
    help = "Check that every model-backed media key exists in Cloudflare R2."

    def add_arguments(self, parser):
        parser.add_argument("--fail-on-missing", action="store_true")
        parser.add_argument(
            "--upload-missing",
            action="store_true",
            help="Upload missing objects from the configured local media storage.",
        )

    def handle(self, *args, **options):
        missing_env = [name for name in REQUIRED_ENV if not os.environ.get(name)]
        if missing_env:
            raise CommandError(
                f"Missing environment variables: {', '.join(missing_env)}"
            )

        client = boto3.client(
            "s3",
            endpoint_url=(
                f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com"
            ),
            aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
            aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
            region_name="auto",
        )
        bucket = os.environ["R2_BUCKET_NAME"]
        references = set()

        for model in apps.get_models():
            fields = [
                field
                for field in model._meta.get_fields()
                if isinstance(field, models.FileField)
            ]
            for field in fields:
                references.update(
                    value
                    for value in model._base_manager.values_list(field.name, flat=True)
                    if value
                )

        missing = []
        uploaded = []
        unavailable = []
        for key in sorted(references):
            try:
                client.head_object(Bucket=bucket, Key=key)
            except ClientError as exc:
                status = exc.response.get("ResponseMetadata", {}).get("HTTPStatusCode")
                error_code = exc.response.get("Error", {}).get("Code")
                if status == 404 or error_code in {"404", "NoSuchKey", "NotFound"}:
                    missing.append(key)
                    if options["upload_missing"] and default_storage.exists(key):
                        content_type = mimetypes.guess_type(key)[0] or "application/octet-stream"
                        with default_storage.open(key, "rb") as source:
                            client.upload_fileobj(
                                source,
                                bucket,
                                key,
                                ExtraArgs={
                                    "ContentType": content_type,
                                    "CacheControl": "public, max-age=31536000, immutable",
                                },
                            )
                        client.head_object(Bucket=bucket, Key=key)
                        uploaded.append(key)
                        self.stdout.write(f"Uploaded to R2: {key}")
                    else:
                        unavailable.append(key)
                        location = "R2 and local storage" if options["upload_missing"] else "R2"
                        self.stderr.write(f"Missing from {location}: {key}")
                else:
                    raise

        self.stdout.write(
            self.style.SUCCESS(
                f"Checked {len(references)} referenced media objects; "
                f"{len(missing)} initially missing from R2, "
                f"{len(uploaded)} uploaded, {len(unavailable)} still missing."
            )
        )
        if unavailable and options["fail_on_missing"]:
            raise CommandError(
                "Database copy aborted because referenced media is unavailable "
                "from both local storage and R2."
            )
