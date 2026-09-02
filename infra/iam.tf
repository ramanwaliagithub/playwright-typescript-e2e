data "aws_iam_policy_document" "codebuild_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["codebuild.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "codebuild" {
  name               = "${var.project}-codebuild-role"
  assume_role_policy = data.aws_iam_policy_document.codebuild_assume_role.json

  tags = {
    Project   = var.project
    ManagedBy = "terraform"
  }
}

# Scoped to exactly the log group CodeBuild writes to — no wildcard log access.
data "aws_iam_policy_document" "codebuild_logs" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = [
      aws_cloudwatch_log_group.codebuild.arn,
      "${aws_cloudwatch_log_group.codebuild.arn}:*",
    ]
  }
}

resource "aws_iam_role_policy" "codebuild_logs" {
  name   = "${var.project}-codebuild-logs"
  role   = aws_iam_role.codebuild.id
  policy = data.aws_iam_policy_document.codebuild_logs.json
}
