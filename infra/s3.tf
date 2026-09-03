data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "reports" {
  bucket = "${var.project}-reports-${data.aws_caller_identity.current.account_id}"

  tags = {
    Project   = var.project
    ManagedBy = "terraform"
    Purpose   = "regression-test-reports"
  }
}

resource "aws_s3_bucket_public_access_block" "reports" {
  bucket = aws_s3_bucket.reports.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "reports" {
  bucket = aws_s3_bucket.reports.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Regression reports are disposable build artifacts, not records that need to be kept
# indefinitely — expire them after 90 days to keep storage cost bounded.
resource "aws_s3_bucket_lifecycle_configuration" "reports" {
  bucket = aws_s3_bucket.reports.id

  rule {
    id     = "expire-old-reports"
    status = "Enabled"

    filter {}

    expiration {
      days = 90
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}
