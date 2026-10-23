package com.aakash.ecom_project.Repo;

import com.aakash.ecom_project.Model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductsRepo extends JpaRepository<Product,Integer> {
}
