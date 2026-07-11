package org.example.library_system.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.example.library_system.common.PageResult;
import org.example.library_system.common.Result;
import org.example.library_system.dto.BookQuery;
import org.example.library_system.entity.Book;
import org.example.library_system.entity.User;
import org.example.library_system.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/books")
public class BookController {

    @Autowired
    private BookService bookService;

    @GetMapping
    public Result<List<Book>> list(@RequestParam(required = false) String name) {
        return Result.success(bookService.list(name));
    }

    @GetMapping("/page")
    public Result<PageResult<Book>> page(BookQuery query) {
        return Result.success(bookService.page(query));
    }

    @GetMapping("/{id}")
    public Result<Book> getById(@PathVariable Integer id) {
        Book book = bookService.getById(id);
        if (book == null) return Result.error("图书不存在");
        return Result.success(book);
    }

    @PostMapping
    public Result<Void> save(@RequestBody Book book, HttpServletRequest request) {
        requireAdmin(request);
        return bookService.save(book) ? Result.success() : Result.error("新增失败");
    }

    @PutMapping
    public Result<Void> update(@RequestBody Book book, HttpServletRequest request) {
        requireAdmin(request);
        return bookService.update(book) ? Result.success() : Result.error("修改失败");
    }

    @DeleteMapping("/{id}")
    public Result<Void> remove(@PathVariable Integer id, HttpServletRequest request) {
        requireAdmin(request);
        return bookService.removeById(id) ? Result.success() : Result.error("删除失败");
    }

    private void requireAdmin(HttpServletRequest request) {
        User current = (User) request.getSession().getAttribute("currentUser");
        if (current == null || !"ADMIN".equals(current.getRole())) {
            throw new RuntimeException("权限不足");
        }
    }
}