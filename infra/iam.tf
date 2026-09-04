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

# Write-only to exactly the reports bucket — no delete, no list-other-buckets. A compromised
# build can publish a report but can't wipe the bucket's existing history.
data "aws_iam_policy_document" "codebuild_reports" {
  statement {
    effect    = "Allow"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.reports.arn}/*"]
  }
}

resource "aws_iam_role_policy" "codebuild_reports" {
  name   = "${var.project}-codebuild-reports"
  role   = aws_iam_role.codebuild.id
  policy = data.aws_iam_policy_document.codebuild_reports.json
}

data "aws_kms_alias" "ssm" {
  name = "alias/aws/ssm"
}

# Read-only, scoped to exactly the 3 parameters this project owns, plus decrypt on the
# AWS-managed SSM key those SecureStrings are encrypted under (not a customer-managed key, so
# no extra KMS cost).
data "aws_iam_policy_document" "codebuild_ssm" {
  statement {
    effect  = "Allow"
    actions = ["ssm:GetParameters"]
    resources = [
      aws_ssm_parameter.admin_username.arn,
      aws_ssm_parameter.admin_password.arn,
      aws_ssm_parameter.base_url.arn,
    ]
  }

  statement {
    effect    = "Allow"
    actions   = ["kms:Decrypt"]
    resources = [data.aws_kms_alias.ssm.target_key_arn]
  }
}

resource "aws_iam_role_policy" "codebuild_ssm" {
  name   = "${var.project}-codebuild-ssm"
  role   = aws_iam_role.codebuild.id
  policy = data.aws_iam_policy_document.codebuild_ssm.json
}
