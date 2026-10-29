
output "db_endpoint" {
  description = "RDS database endpoint"
  value       = aws_db_instance.main.address
}

output "db_port" {
  description = "RDS database port"
  value       = aws_db_instance.main.port
}

output "db_security_group_id" {
  description = "Security group ID for the RDS database"
  value       = aws_security_group.database.id
}
