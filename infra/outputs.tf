output "codebuild_project_name" {
  description = "Name of the CodeBuild project running the scheduled regression suite."
  value       = aws_codebuild_project.regression.name
}

output "codebuild_role_arn" {
  description = "ARN of the IAM role CodeBuild assumes to run builds."
  value       = aws_iam_role.codebuild.arn
}

output "codebuild_log_group_name" {
  description = "CloudWatch log group CodeBuild writes build logs to."
  value       = aws_cloudwatch_log_group.codebuild.name
}

output "reports_bucket_name" {
  description = "S3 bucket regression reports are published to."
  value       = aws_s3_bucket.reports.bucket
}

output "nightly_schedule_rule_name" {
  description = "EventBridge rule that triggers the nightly regression build."
  value       = aws_cloudwatch_event_rule.nightly_regression.name
}
