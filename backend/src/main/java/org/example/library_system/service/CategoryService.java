package org.example.library_system.service;

import org.example.library_system.entity.Category;

import java.util.List;

public interface CategoryService {
    List<Category> list();
    Category getById(Integer id);
    boolean save(Category category);
    boolean update(Category category);
    boolean removeById(Integer id);
}
