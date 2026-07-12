package org.example.library_system.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.example.library_system.common.Result;
import org.example.library_system.entity.User;
import org.example.library_system.service.StatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    @Autowired
    private StatsService statsService;

    @GetMapping("/overview")
    public Result<Map<String, Object>> overview(HttpServletRequest request) {
        requireAdmin(request);
        return Result.success(statsService.overview());
    }

    @GetMapping("/books-per-category")
    public Result<List<Map<String, Object>>> booksPerCategory(HttpServletRequest request) {
        requireAdmin(request);
        return Result.success(statsService.booksPerCategory());
    }

    @GetMapping("/top-borrowed")
    public Result<List<Map<String, Object>>> topBorrowed(@RequestParam(defaultValue = "5") int limit,
                                                         HttpServletRequest request) {
        requireAdmin(request);
        return Result.success(statsService.topBorrowedBooks(limit));
    }

    @GetMapping("/recent-borrows")
    public Result<List<Map<String, Object>>> recentBorrows(@RequestParam(defaultValue = "10") int limit,
                                                           HttpServletRequest request) {
        requireAdmin(request);
        return Result.success(statsService.recentBorrows(limit));
    }

    @GetMapping("/my-overview/{readerId}")
    public Result<Map<String, Object>> myOverview(@PathVariable Integer readerId, HttpServletRequest request) {
        var current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        if ("READER".equals(current.getRole()) && !readerId.equals(current.getReaderId()))
            return Result.error("无权查看他人统计");
        return Result.success(statsService.readerOverview(readerId));
    }

    private void requireAdmin(HttpServletRequest request) {
        Optional.ofNullable((User) request.getSession().getAttribute("currentUser"))
                .filter(u -> "ADMIN".equals(u.getRole()))
                .orElseThrow(() -> new RuntimeException("权限不足"));
    }
}