output "state_bucket_name" {
  description = "S3 bucket holding Terraform remote state. Copy into infra/backend.tf."
  value       = aws_s3_bucket.terraform_state.bucket
}

output "state_lock_table_name" {
  description = "DynamoDB table used for Terraform state locking. Copy into infra/backend.tf."
  value       = aws_dynamodb_table.terraform_lock.name
}

output "aws_region" {
  description = "Region the state backend was created in. Copy into infra/backend.tf."
  value       = var.aws_region
}
