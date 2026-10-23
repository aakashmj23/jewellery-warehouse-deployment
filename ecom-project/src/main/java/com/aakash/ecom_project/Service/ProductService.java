package com.aakash.ecom_project.Service;

import com.aakash.ecom_project.Model.Product;
import com.aakash.ecom_project.Repo.ProductsRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class ProductService {

    @Autowired
    private ProductsRepo repo;

    public List<Product> getAllProducts() {
        return repo.findAll();
    }

    public Product getProductById(int prodId) {
        return repo.findById(prodId).orElse(null);
    }

    public Product addProduct(Product prod, MultipartFile imageFile) throws IOException {
        prod.setImageName(imageFile.getOriginalFilename());
        prod.setImageType(imageFile.getContentType());
        prod.setImageData(imageFile.getBytes());
        return repo.save(prod);
    }

    public Product updateProducts(int id, Product prod, MultipartFile imageFile) throws IOException {
        prod.setId(id);

        if (imageFile != null && !imageFile.isEmpty()
                && imageFile.getOriginalFilename() != null
                && !imageFile.getOriginalFilename().equals("placeholder.jpg")) {
            prod.setImageName(imageFile.getOriginalFilename());
            prod.setImageType(imageFile.getContentType());
            prod.setImageData(imageFile.getBytes());
        } else {
            // keep existing image from DB
            Product existing = repo.findById(id).orElse(null);
            if (existing != null) {
                prod.setImageName(existing.getImageName());
                prod.setImageType(existing.getImageType());
                prod.setImageData(existing.getImageData());
            }
        }

        return repo.save(prod);
    }

    public void deleteProducts(int prodId) {
        repo.deleteById(prodId);
    }
}
