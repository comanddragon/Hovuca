"""Copy every object from the former Neon S3-compatible bucket to Cloudflare R2."""

import os

import boto3
from botocore.exceptions import ClientError
from django.core.management.base import BaseCommand, CommandError


REQUIRED_ENV = (
    "NEON_STORAGE_ENDPOINT",
    "NEON_STORAGE_BUCKET",
    "NEON_STORAGE_KEY_ID",
    "NEON_STORAGE_SECRET",
    "R2_ACCOUNT_ID",
    "R2_BUCKET_NAME",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
)


class Command(BaseCommand):
    help = "Idempotently copy media objects from Neon storage to Cloudflare R2."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        missing = [name for name in REQUIRED_ENV if not os.environ.get(name)]
        if missing:
            raise CommandError(f"Missing environment variables: {', '.join(missing)}")

        source = boto3.client(
            "s3",
            endpoint_url=os.environ["NEON_STORAGE_ENDPOINT"],
            aws_access_key_id=os.environ["NEON_STORAGE_KEY_ID"],
            aws_secret_access_key=os.environ["NEON_STORAGE_SECRET"],
            region_name=os.environ.get("NEON_STORAGE_REGION", "auto"),
        )
        destination = boto3.client(
            "s3",
            endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
            aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
            aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
            region_name="auto",
        )
        source_bucket = os.environ["NEON_STORAGE_BUCKET"]
        destination_bucket = os.environ["R2_BUCKET_NAME"]

        copied = skipped = 0
        paginator = source.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=source_bucket):
            for item in page.get("Contents", []):
                key = item["Key"]
                try:
                    destination.head_object(Bucket=destination_bucket, Key=key)
                    skipped += 1
                    continue
                except ClientError as exc:
                    if exc.response.get("ResponseMetadata", {}).get("HTTPStatusCode") != 404:
                        raise

                if not options["dry_run"]:
                    body = source.get_object(Bucket=source_bucket, Key=key)["Body"]
                    destination.upload_fileobj(body, destination_bucket, key)
                copied += 1

        suffix = " (dry run)" if options["dry_run"] else ""
        self.stdout.write(self.style.SUCCESS(f"{copied} copied, {skipped} already present{suffix}"))
