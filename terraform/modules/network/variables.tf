
variable "project_name" {
  description = "Name used to identify project network resources"
  type        = string
}

variable "vpc_cidr" {
  description = "IPv4 CIDR range for the project VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Two Availability Zones for the network"
  type        = list(string)

  validation {
    condition     = length(var.availability_zones) == 2 && length(distinct(var.availability_zones)) == 2
    error_message = "Provide exactly two distinct Availability Zones."
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR ranges for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]

  validation {
    condition     = length(var.public_subnet_cidrs) == 2
    error_message = "Provide exactly two public subnet CIDR ranges."
  }

  validation {
    condition = (
      length(distinct(var.public_subnet_cidrs)) ==
      length(var.public_subnet_cidrs)
    )
    error_message = "Public subnet CIDR ranges must be unique."
  }
}

variable "private_subnet_cidrs" {
  description = "CIDR ranges for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]

  validation {
    condition     = length(var.private_subnet_cidrs) == 2
    error_message = "Provide exactly two private subnet CIDR ranges."
  }

  validation {
    condition = (
      length(distinct(var.private_subnet_cidrs)) ==
      length(var.private_subnet_cidrs)
    )
    error_message = "Private subnet CIDR ranges must be unique."
  }
}
