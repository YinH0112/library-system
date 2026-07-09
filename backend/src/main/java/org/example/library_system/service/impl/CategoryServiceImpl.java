package org.example.library_system.service.impl;

import org.example.library_system.entity.Category;
import org.example.library_system.mapper.CategoryMapper;
import org.example.library_system.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryServiceImpl implements CategoryService {

    @Autowired
    private CategoryMapper categoryMapper;

    @Override
    public List<Category> list() {
        return categoryMapper.findAll();
    }

    @Override
    public Category getById(Integer id) {
        return categoryMapper.findById(id);
    }

    @Override
    public boolean save(Category category) {
        if (category.getName() == null || category.getName().trim().isEmpty()) {
            return false;
        }
        return categoryMapper.insert(category) > 0;
    }

    @Override
    public boolean update(Category category) {
        return categoryMapper.update(category) > 0;
    }

    @Override
    public boolean removeById(Integer id) {
        // 阻止删除仍被引用的分类
        if (categoryMapper.countBooksByCategory(id) > 0) {
            return false;
        }
        return categoryMapper.deleteById(id) > 0;
    }
}
