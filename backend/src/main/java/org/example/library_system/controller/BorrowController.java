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

@RestController
@RequestMapping("/api/borrows")
public class BorrowController {

    @Autowired
    private BorrowService borrowService;

    @GetMapping
    public Result<List<Borrow>> list(@RequestParam(required = false) String status,
                                     @RequestParam(required = false) Integer readerId) {
        return Result.success(borrowService.list(status, readerId));
    }

    @GetMapping("/{id}")
    public Result<Borrow> getById(@PathVariable Integer id) {
        Borrow b = borrowService.getById(id);
        if (b == null) return Result.error("借阅记录不存在");
        return Result.success(b);
    }

    @GetMapping("/my/{readerId}")
    public Result<List<Borrow>> myBorrows(@PathVariable Integer readerId, HttpServletRequest request) {
        User current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) {
            return Result.error("未登录");
        }
        // 借阅者只能查自己的;管理员可查任意
        if ("READER".equals(current.getRole()) && !readerId.equals(current.getReaderId())) {
            return Result.error("无权查看他人借阅记录");
        }
        return Result.success(borrowService.list(null, readerId));
    }

    @PostMapping("/borrow")
    public Result<Void> borrow(@RequestBody BorrowAction action) {
        BorrowService.Result r = borrowService.borrow(action);
        return r.isSuccess() ? Result.success() : Result.error(r.getMessage());
    }

    @PostMapping("/return/{id}")
    public Result<Void> returnBook(@PathVariable Integer id) {
        BorrowService.Result r = borrowService.returnBook(id);
        return r.isSuccess() ? Result.success() : Result.error(r.getMessage());
    }
}
