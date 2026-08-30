provider "aws" {
  region = var.aws_region
}

# S3 bucket names are globally unique across all AWS accounts, not just this one — a random
# suffix avoids collisions without needing to know the account ID up front.
resource "random_id" "state_bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "terraform_state" {
  bucket = "${var.project}-tfstate-${random_id.state_bucket_suffix.hex}"

  # This bucket only ever holds Terraform state, never arbitrary data, so force_destroy is
  # safe here and lets `terraform destroy` clean up a non-empty (versioned) bucket without a
  # separate manual emptying step — deliberately a disposable/rebuildable bootstrap stack.
  force_destroy = true

  tags = {
    Project   = var.project
    ManagedBy = "terraform"
    Purpose   = "terraform-remote-state"
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "terraform_lock" {
  name         = "${var.project}-tfstate-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Project   = var.project
    ManagedBy = "terraform"
    Purpose   = "terraform-state-locking"
  }
}
