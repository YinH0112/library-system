package org.example.library_system.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.example.library_system.common.Result;
import org.example.library_system.entity.BorrowRequest;
import org.example.library_system.entity.User;
import org.example.library_system.service.BorrowRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 借阅申请控制器
 * - 借阅者: 发起申请 / 查看自己申请 / 取消申请
 * - 管理员: 查看所有申请 / 批准 / 拒绝 / 待审批计数
 */
@RestController
@RequestMapping("/api/borrow-requests")
public class BorrowRequestController {

    @Autowired
    private BorrowRequestService requestService;

    /** 借阅者发起申请 */
    @PostMapping("/apply")
    public Result<Void> apply(@RequestBody BorrowRequest req, HttpServletRequest request) {
        User current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        if (!"READER".equals(current.getRole())) {
            return Result.error("仅借阅者可发起申请");
        }
        if (current.getReaderId() == null) {
            return Result.error("当前账号未关联读者信息");
        }
        req.setReaderId(current.getReaderId());
        BorrowRequestService.Result r = requestService.apply(req);
        return r.isSuccess() ? Result.success() : Result.error(r.getMessage());
    }

    /** 借阅者查看自己的申请 */
    @GetMapping("/my")
    public Result<List<BorrowRequest>> myRequests(@RequestParam(required = false) String status,
                                                   HttpServletRequest request) {
        User current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        if (!"READER".equals(current.getRole())) {
            return Result.error("仅借阅者可访问");
        }
        return Result.success(requestService.list(status, current.getReaderId()));
    }

    /** 借阅者取消自己的申请 */
    @PostMapping("/{id}/cancel")
    public Result<Void> cancel(@PathVariable Integer id, HttpServletRequest request) {
        User current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        if (!"READER".equals(current.getRole())) {
            return Result.error("仅借阅者可取消");
        }
        BorrowRequestService.Result r = requestService.cancel(id, current.getReaderId());
        return r.isSuccess() ? Result.success() : Result.error(r.getMessage());
    }

    /** 管理员查看所有申请(可按状态筛选) */
    @GetMapping
    public Result<List<BorrowRequest>> list(@RequestParam(required = false) String status,
                                            HttpServletRequest request) {
        requireAdmin(request);
        return Result.success(requestService.list(status, null));
    }

    /** 管理员批准申请 */
    @PostMapping("/{id}/approve")
    public Result<Void> approve(@PathVariable Integer id,
                                @RequestParam(required = false) String adminRemark,
                                HttpServletRequest request) {
        User current = requireAdmin(request);
        BorrowRequestService.Result r = requestService.approve(id, current.getId(), adminRemark);
        return r.isSuccess() ? Result.success() : Result.error(r.getMessage());
    }

    /** 管理员拒绝申请 */
    @PostMapping("/{id}/reject")
    public Result<Void> reject(@PathVariable Integer id,
                               @RequestParam(required = false) String adminRemark,
                               HttpServletRequest request) {
        User current = requireAdmin(request);
        BorrowRequestService.Result r = requestService.reject(id, current.getId(), adminRemark);
        return r.isSuccess() ? Result.success() : Result.error(r.getMessage());
    }

    /** 待审批申请数(管理员 dashboard 用) */
    @GetMapping("/pending-count")
    public Result<Integer> pendingCount(HttpServletRequest request) {
        User current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        // 管理员看总数;借阅者看自己的
        if ("ADMIN".equals(current.getRole())) {
            return Result.success(requestService.countPending());
        }
        // 借阅者:返回自己的待审批数
        return Result.success(requestService.list("PENDING", current.getReaderId()).size());
    }

    @GetMapping("/{id}")
    public Result<BorrowRequest> getById(@PathVariable Integer id, HttpServletRequest request) {
        User current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        BorrowRequest req = requestService.getById(id);
        if (req == null) return Result.error("申请不存在");
        // 借阅者只能看自己的
        if ("READER".equals(current.getRole()) && !req.getReaderId().equals(current.getReaderId())) {
            return Result.error("无权查看他人申请");
        }
        return Result.success(req);
    }

    private User requireAdmin(HttpServletRequest request) {
        User current = (User) request.getSession().getAttribute("currentUser");
        if (current == null || !"ADMIN".equals(current.getRole())) {
            throw new RuntimeException("权限不足");
        }
        return current;
    }
}
