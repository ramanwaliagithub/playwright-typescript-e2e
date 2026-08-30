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
    bucket         = "rbp-e2e-tfstate-f852008a"
    key            = "rbp-e2e/terraform.tfstate"
    region         = "ap-southeast-2"
    dynamodb_table = "rbp-e2e-tfstate-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = "ap-southeast-2"
}
