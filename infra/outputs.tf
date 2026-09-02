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
