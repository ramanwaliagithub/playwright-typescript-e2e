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
  # bootstrap has been applied. A real bucket (rbp-e2e-tfstate-f852008a) was created, wired in
  # here, and verified working (terraform init/plan succeeded against it, state lock acquired
  # via DynamoDB), then deliberately torn down — see SETUP.md and E2E_manual.md for the full
  # apply → verify → destroy record and the exact steps to redo this for real.
  backend "s3" {
    bucket         = "REPLACE_WITH_BOOTSTRAP_OUTPUT_state_bucket_name"
    key            = "rbp-e2e/terraform.tfstate"
    region         = "ap-southeast-2"
    dynamodb_table = "rbp-e2e-tfstate-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = "ap-southeast-2"
}
