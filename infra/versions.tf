terraform {
  required_version = ">= 1.15.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Bucket/table/region below must match infra/bootstrap's outputs exactly — backend blocks
  # can't reference variables or other resources' outputs, so these are hardcoded here once
  # bootstrap has been applied. See SETUP.md for the exact values used and when.
  backend "s3" {
    bucket         = "REPLACE_WITH_BOOTSTRAP_OUTPUT_state_bucket_name"
    key            = "rbp-e2e/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "rbp-e2e-tfstate-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-1"
}
