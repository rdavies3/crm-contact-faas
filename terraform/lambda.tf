resource "aws_iam_role" "lambda_exec" {
  name = "lambda-exec-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Service = "lambda.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_exec" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Deploy Contact Get Handler Lambda
resource "aws_lambda_function" "contact_get_handler" {
  function_name    = "contact-get-handler-${var.environment}"
  filename         = "${path.module}/lambda/contact-get-handler-${var.environment}.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/contact-get-handler-${var.environment}.zip")
  role             = aws_iam_role.lambda_exec.arn
  handler          = "app.handler"
  runtime          = "nodejs20.x"
  timeout          = 10
  environment {
    variables = {
      CONTACT_MATCH_SFN_ARN = "arn:aws:states:${var.aws_region}:${var.aws_account_number}:stateMachine:contact-parallel-query-${var.environment}"
    }
  }
}

# Deploy Formatter Lambda
resource "aws_lambda_function" "format_contact_output" {
  function_name    = "format-contact-output-${var.environment}"
  filename         = "${path.module}/lambda/format-contact-output-${var.environment}.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/format-contact-output-${var.environment}.zip")
  role             = aws_iam_role.lambda_exec.arn
  handler          = "app.handler"
  runtime          = "nodejs20.x"
  timeout          = 10
}

output "format_contact_output_arn" {
  description = "ARN of the format-contact-output Lambda"
  value       = aws_lambda_function.format_contact_output.arn
}

output "contact_get_handler_arn" {
  description = "ARN of the contact-get-handler Lambda"
  value       = aws_lambda_function.contact_get_handler.arn
}
