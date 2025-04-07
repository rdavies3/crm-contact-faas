output "contact_match_sfn_role_arn" {
  description = "IAM Role ARN for the Contact Match Step Function"
  value       = aws_iam_role.contact_match_sfn_role.arn
}

output "contact_match_step_function_arn" {
  description = "ARN of the Contact Match Step Function"
  value       = aws_sfn_state_machine.contact_match.arn
}
