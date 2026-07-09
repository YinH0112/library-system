package org.example.library_system.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.example.library_system.entity.Category;

import java.util.List;

@Mapper
public interface CategoryMapper {
    List<Category> findAll();
    Category findById(Integer id);
    int insert(Category category);
    int update(Category category);
    int deleteById(Integer id);
    int countBooksByCategory(Integer id);
}
