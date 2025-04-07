resource "aws_iam_role" "contact_match_sfn_role" {
  name = "contact-match-sfn-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "states.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })
}

data "aws_iam_role" "lambda_exec" {
  name = "lambda-exec-sandbox"
}

resource "aws_iam_policy" "allow_start_contact_match_sfn" {
  name        = "AllowStartContactMatchStepFunction"
  description = "Allows starting the Contact Match Step Function"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "states:StartExecution"
        ],
        Resource = "arn:aws:states:us-west-2:982081057374:stateMachine:contact-parallel-query"
      }
    ]
  })
}

# Attach this policy to the Lambda execution role
resource "aws_iam_role_policy_attachment" "lambda_allow_start_contact_match" {
  role       = data.aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.allow_start_contact_match_sfn.arn
}
