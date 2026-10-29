
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "network" {
  source = "../../modules/network"

  project_name       = "jewellery-warehouse"
  availability_zones = ["ap-south-2a", "ap-south-2b"]
}


module "eks" {
  source = "../../modules/eks"

  project_name                = "jewellery-warehouse"
  kubernetes_version          = "1.36"
  private_subnet_ids          = module.network.private_subnet_ids
  cluster_public_access_cidrs = var.cluster_public_access_cidrs
}


module "rds" {
  source = "../../modules/rds"

  project_name       = "jewellery-warehouse"
  private_subnet_ids = module.network.private_subnet_ids
  vpc_id             = module.network.vpc_id

  database_name                 = "aakash"
  database_username             = "dbadmin"
  instance_class                = "db.t4g.micro"
  database_password             = var.database_password
  application_security_group_id = module.eks.cluster_security_group_id
}
