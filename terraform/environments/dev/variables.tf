
variable "aws_region" {
  description = "AWS region for the Jewellery Warehouse deployment"
  type        = string
  default     = "ap-south-2"
}
variable "database_password" {
  description = "Master password for the RDS database"
  type        = string
  sensitive   = true
}
variable "cluster_public_access_cidrs" {
  description = "Trusted public IPv4 CIDR ranges allowed to access the EKS API"
  type        = list(string)
}