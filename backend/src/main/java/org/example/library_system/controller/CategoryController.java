package org.example.library_system.controller;

import org.example.library_system.common.Result;
import org.example.library_system.entity.Category;
import org.example.library_system.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @GetMapping
    public Result<List<Category>> list() {
        return Result.success(categoryService.list());
    }

    @GetMapping("/{id}")
    public Result<Category> getById(@PathVariable Integer id) {
        Category c = categoryService.getById(id);
        if (c == null) return Result.error("分类不存在");
        return Result.success(c);
    }

    @PostMapping
    public Result<Void> save(@RequestBody Category category) {
        return categoryService.save(category) ? Result.success() : Result.error("新增失败(名称不能为空)");
    }

    @PutMapping
    public Result<Void> update(@RequestBody Category category) {
        return categoryService.update(category) ? Result.success() : Result.error("修改失败");
    }

    @DeleteMapping("/{id}")
    public Result<Void> remove(@PathVariable Integer id) {
        if (!categoryService.removeById(id)) {
            return Result.error("该分类下仍有图书,无法删除");
        }
        return Result.success();
    }
}
