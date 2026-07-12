package org.example.library_system.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.example.library_system.common.Result;
import org.example.library_system.entity.Category;
import org.example.library_system.entity.User;
import org.example.library_system.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

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
        return Optional.ofNullable(categoryService.getById(id))
                .map(Result::success)
                .orElseGet(() -> Result.error("分类不存在"));
    }

    @PostMapping
    public Result<Void> save(@RequestBody Category category, HttpServletRequest request) {
        requireAdmin(request);
        return categoryService.save(category) ? Result.success() : Result.error("新增失败(名称不能为空)");
    }

    @PutMapping
    public Result<Void> update(@RequestBody Category category, HttpServletRequest request) {
        requireAdmin(request);
        return categoryService.update(category) ? Result.success() : Result.error("修改失败");
    }

    @DeleteMapping("/{id}")
    public Result<Void> remove(@PathVariable Integer id, HttpServletRequest request) {
        requireAdmin(request);
        if (!categoryService.removeById(id)) {
            return Result.error("该分类下仍有图书,无法删除");
        }
        return Result.success();
    }

    private void requireAdmin(HttpServletRequest request) {
        Optional.ofNullable((User) request.getSession().getAttribute("currentUser"))
                .filter(u -> "ADMIN".equals(u.getRole()))
                .orElseThrow(() -> new RuntimeException("权限不足"));
    }
}