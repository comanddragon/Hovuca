import os

import boto3
from django.core.management.base import BaseCommand, CommandError

REQUIRED_ENV = (
    "SUPABASE_PROJECT_REF",
    "SUPABASE_STORAGE_BUCKET",
    "SUPABASE_STORAGE_KEY_ID",
    "SUPABASE_STORAGE_SECRET",
    "NEON_STORAGE_ENDPOINT",
    "NEON_STORAGE_BUCKET",
    "NEON_STORAGE_KEY_ID",
    "NEON_STORAGE_SECRET",
)


class Command(BaseCommand):
    help = "Copy media objects from the existing Supabase bucket to Neon Object Storage."

    def handle(self, *args, **options):
        missing = [name for name in REQUIRED_ENV if not os.environ.get(name)]
        if missing:
            raise CommandError(f"Missing environment variables: {', '.join(missing)}")

        source = boto3.client(
            "s3",
            endpoint_url=f"https://{os.environ['SUPABASE_PROJECT_REF']}.supabase.co/storage/v1/s3",
            aws_access_key_id=os.environ["SUPABASE_STORAGE_KEY_ID"],
            aws_secret_access_key=os.environ["SUPABASE_STORAGE_SECRET"],
            region_name=os.environ.get("SUPABASE_STORAGE_REGION", "ap-southeast-1"),
        )
        destination = boto3.client(
            "s3",
            endpoint_url=os.environ["NEON_STORAGE_ENDPOINT"],
            aws_access_key_id=os.environ["NEON_STORAGE_KEY_ID"],
            aws_secret_access_key=os.environ["NEON_STORAGE_SECRET"],
            region_name=os.environ.get("NEON_STORAGE_REGION", "auto"),
        )

        source_bucket = os.environ["SUPABASE_STORAGE_BUCKET"]
        destination_bucket = os.environ["NEON_STORAGE_BUCKET"]
        copied = 0
        copied_bytes = 0

        paginator = source.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=source_bucket, Prefix="media/"):
            for item in page.get("Contents", []):
                key = item["Key"]
                body = source.get_object(Bucket=source_bucket, Key=key)["Body"]
                destination.upload_fileobj(
                    body,
                    destination_bucket,
                    key,
                    ExtraArgs={"CacheControl": "max-age=86400"},
                )
                copied += 1
                copied_bytes += item["Size"]
                self.stdout.write(f"Copied {key}")

        self.stdout.write(self.style.SUCCESS(
            f"Copied {copied} objects ({copied_bytes} bytes) to Neon. Source files were not deleted."
        ))
