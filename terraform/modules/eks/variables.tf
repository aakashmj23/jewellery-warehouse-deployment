
variable "project_name" {
  description = "Name used to identify project resources"
  type        = string
}

variable "kubernetes_version" {
  description = "Kubernetes version for the EKS cluster"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs where EKS Fargate workloads will run"
  type        = list(string)
}
variable "cluster_public_access_cidrs" {
  description = "Trusted public IPv4 CIDR ranges allowed to access the EKS API"
  type        = list(string)
}