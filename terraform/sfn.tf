# Step Function Execution Role
resource "aws_iam_role" "contact_match_sfn_role" {
  name = "contact-match-sfn-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Service = "states.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })
}

# Allow Step Function to invoke the sf-query lambda
resource "aws_iam_role_policy" "sfn_invoke_sf_query" {
  name = "sfn-invoke-sf-query-${var.environment}"
  role = aws_iam_role.contact_match_sfn_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = ["lambda:InvokeFunction"],
      Resource = "arn:aws:lambda:us-west-2:982081057374:function:sf-query-sandbox"
    }]
  })
}

# Deploy the Step Function
resource "aws_sfn_state_machine" "contact_match" {
  name     = "contact-parallel-query-${var.environment}"
  role_arn = aws_iam_role.contact_match_sfn_role.arn

  definition = templatefile("${path.module}/statemachines/contact-parallel-query.asl.json", {
    sf_query_lambda_arn  = "arn:aws:lambda:${var.aws_region}:${var.aws_account_number}:function:sf-query-${var.environment}"
    formatter_lambda_arn = "arn:aws:lambda:${var.aws_region}:${var.aws_account_number}:function:format-contact-output-${var.environment}"
  })
}

resource "aws_iam_policy" "can_start_contact_match" {
  name = "can-start-contact-match-${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = ["states:StartExecution"],
      Resource = aws_sfn_state_machine.contact_match.arn
    }]
  })
}
