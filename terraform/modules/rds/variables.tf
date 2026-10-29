
variable "project_name" {
  description = "Name used to identify project resources"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for the RDS DB subnet group"
  type        = list(string)
}

variable "vpc_id" {
  description = "VPC ID where the database will be deployed"
  type        = string
}

variable "database_name" {
  description = "Name of the application database"
  type        = string
  default     = "aakash"
}

variable "database_username" {
  description = "Master username for the RDS database"
  type        = string
  default     = "dbadmin"
}

variable "database_password" {
  description = "Master password for the RDS database"
  type        = string
  sensitive   = true
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "application_security_group_id" {
  description = "Security group allowed to connect to the RDS database"
  type        = string
}