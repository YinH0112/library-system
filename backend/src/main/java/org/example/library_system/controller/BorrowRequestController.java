package org.example.library_system.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.example.library_system.common.Result;
import org.example.library_system.entity.BorrowRequest;
import org.example.library_system.entity.User;
import org.example.library_system.service.BorrowRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/borrow-requests")
public class BorrowRequestController {

    @Autowired
    private BorrowRequestService requestService;

    @PostMapping("/apply")
    public Result<Void> apply(@RequestBody BorrowRequest req, HttpServletRequest request) {
        var current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        if (!"READER".equals(current.getRole())) return Result.error("仅借阅者可发起申请");
        if (current.getReaderId() == null) return Result.error("当前账号未关联读者信息");
        req.setReaderId(current.getReaderId());
        var r = requestService.apply(req);
        return r.isSuccess() ? Result.success() : Result.error(r.getMessage());
    }

    @GetMapping("/my")
    public Result<List<BorrowRequest>> myRequests(@RequestParam(required = false) String status,
                                                   HttpServletRequest request) {
        var current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        if (!"READER".equals(current.getRole())) return Result.error("仅借阅者可访问");
        return Result.success(requestService.list(status, current.getReaderId()));
    }

    @PostMapping("/{id}/cancel")
    public Result<Void> cancel(@PathVariable Integer id, HttpServletRequest request) {
        var current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        if (!"READER".equals(current.getRole())) return Result.error("仅借阅者可取消");
        var r = requestService.cancel(id, current.getReaderId());
        return r.isSuccess() ? Result.success() : Result.error(r.getMessage());
    }

    @GetMapping
    public Result<List<BorrowRequest>> list(@RequestParam(required = false) String status,
                                            HttpServletRequest request) {
        requireAdmin(request);
        return Result.success(requestService.list(status, null));
    }

    @PostMapping("/{id}/approve")
    public Result<Void> approve(@PathVariable Integer id,
                                @RequestParam(required = false) String adminRemark,
                                HttpServletRequest request) {
        var current = requireAdmin(request);
        var r = requestService.approve(id, current.getId(), adminRemark);
        return r.isSuccess() ? Result.success() : Result.error(r.getMessage());
    }

    @PostMapping("/{id}/reject")
    public Result<Void> reject(@PathVariable Integer id,
                               @RequestParam(required = false) String adminRemark,
                               HttpServletRequest request) {
        var current = requireAdmin(request);
        var r = requestService.reject(id, current.getId(), adminRemark);
        return r.isSuccess() ? Result.success() : Result.error(r.getMessage());
    }

    @GetMapping("/pending-count")
    public Result<Integer> pendingCount(HttpServletRequest request) {
        var current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        if ("ADMIN".equals(current.getRole())) {
            return Result.success(requestService.countPending());
        }
        return Result.success(requestService.list("PENDING", current.getReaderId()).size());
    }

    @GetMapping("/{id}")
    public Result<BorrowRequest> getById(@PathVariable Integer id, HttpServletRequest request) {
        var current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        var req = requestService.getById(id);
        if (req == null) return Result.error("申请不存在");
        if ("READER".equals(current.getRole()) && !req.getReaderId().equals(current.getReaderId()))
            return Result.error("无权查看他人申请");
        return Result.success(req);
    }

    private User requireAdmin(HttpServletRequest request) {
        return Optional.ofNullable((User) request.getSession().getAttribute("currentUser"))
                .filter(u -> "ADMIN".equals(u.getRole()))
                .orElseThrow(() -> new RuntimeException("权限不足"));
    }
}