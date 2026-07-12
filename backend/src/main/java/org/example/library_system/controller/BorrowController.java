package org.example.library_system.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.example.library_system.common.Result;
import org.example.library_system.dto.BorrowAction;
import org.example.library_system.entity.Borrow;
import org.example.library_system.entity.User;
import org.example.library_system.service.BorrowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/borrows")
public class BorrowController {

    @Autowired
    private BorrowService borrowService;

    @GetMapping
    public Result<List<Borrow>> list(@RequestParam(required = false) String status,
                                     @RequestParam(required = false) Integer readerId,
                                     HttpServletRequest request) {
        requireAdmin(request);
        return Result.success(borrowService.list(status, readerId));
    }

    @GetMapping("/{id}")
    public Result<Borrow> getById(@PathVariable Integer id, HttpServletRequest request) {
        var current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        var borrow = borrowService.getById(id);
        if (borrow == null) return Result.error("借阅记录不存在");
        if ("READER".equals(current.getRole()) && !borrow.getReaderId().equals(current.getReaderId()))
            return Result.error("无权查看他人借阅记录");
        return Result.success(borrow);
    }

    @GetMapping("/my/{readerId}")
    public Result<List<Borrow>> myBorrows(@PathVariable Integer readerId, HttpServletRequest request) {
        var current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        if ("READER".equals(current.getRole()) && !readerId.equals(current.getReaderId()))
            return Result.error("无权查看他人借阅记录");
        return Result.success(borrowService.list(null, readerId));
    }

    @PostMapping("/borrow")
    public Result<Void> borrow(@RequestBody BorrowAction action, HttpServletRequest request) {
        requireAdmin(request);
        var r = borrowService.borrow(action);
        return r.isSuccess() ? Result.success() : Result.error(r.getMessage());
    }

    @PostMapping("/return/{id}")
    public Result<Void> returnBook(@PathVariable Integer id, HttpServletRequest request) {
        requireAdmin(request);
        var r = borrowService.returnBook(id);
        return r.isSuccess() ? Result.success() : Result.error(r.getMessage());
    }

    private void requireAdmin(HttpServletRequest request) {
        Optional.ofNullable((User) request.getSession().getAttribute("currentUser"))
                .filter(u -> "ADMIN".equals(u.getRole()))
                .orElseThrow(() -> new RuntimeException("权限不足"));
    }
}