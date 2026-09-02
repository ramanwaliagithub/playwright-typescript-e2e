resource "aws_cloudwatch_log_group" "codebuild" {
  name              = "/codebuild/${var.project}"
  retention_in_days = 30

  tags = {
    Project   = var.project
    ManagedBy = "terraform"
  }
}
