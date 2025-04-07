output "contact_match_sfn_role_arn" {
  description = "IAM Role ARN for the Contact Match Step Function"
  value       = aws_iam_role.contact_match_sfn_role.arn
}
