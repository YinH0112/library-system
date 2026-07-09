package org.example.library_system.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.example.library_system.common.Result;
import org.example.library_system.entity.Notice;
import org.example.library_system.entity.User;
import org.example.library_system.service.NoticeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 公告通知控制器
 * - 所有登录用户: 查看已发布公告
 * - 管理员: CRUD + 置顶
 */
@RestController
@RequestMapping("/api/notices")
public class NoticeController {

    @Autowired
    private NoticeService noticeService;

    /** 已发布公告列表(所有登录用户可访问) */
    @GetMapping("/published")
    public Result<List<Notice>> listPublished(@RequestParam(required = false) String type) {
        return Result.success(noticeService.listPublished(type));
    }

    /** 置顶公告(借阅者首页轮播) */
    @GetMapping("/pinned")
    public Result<List<Notice>> pinned() {
        List<Notice> all = noticeService.listPublished(null);
        return Result.success(all.stream().filter(n -> n.getPinned() != null && n.getPinned() == 1).toList());
    }

    /** 管理员:所有公告(含草稿) */
    @GetMapping
    public Result<List<Notice>> listAll(@RequestParam(required = false) String type,
                                       HttpServletRequest request) {
        requireAdmin(request);
        return Result.success(noticeService.listAll(type));
    }

    @GetMapping("/{id}")
    public Result<Notice> getById(@PathVariable Integer id) {
        Notice n = noticeService.getById(id);
        if (n == null) return Result.error("公告不存在");
        return Result.success(n);
    }

    @PostMapping
    public Result<Void> create(@RequestBody Notice notice, HttpServletRequest request) {
        User current = requireAdmin(request);
        notice.setPublisherId(current.getId());
        return noticeService.save(notice) ? Result.success() : Result.error("标题和正文不能为空");
    }

    @PutMapping
    public Result<Void> update(@RequestBody Notice notice, HttpServletRequest request) {
        requireAdmin(request);
        return noticeService.update(notice) ? Result.success() : Result.error("更新失败");
    }

    @PutMapping("/{id}/pinned")
    public Result<Void> togglePinned(@PathVariable Integer id,
                                     @RequestParam boolean pinned,
                                     HttpServletRequest request) {
        requireAdmin(request);
        return noticeService.togglePinned(id, pinned) ? Result.success() : Result.error("操作失败");
    }

    @DeleteMapping("/{id}")
    public Result<Void> remove(@PathVariable Integer id, HttpServletRequest request) {
        requireAdmin(request);
        return noticeService.removeById(id) ? Result.success() : Result.error("删除失败");
    }

    private User requireAdmin(HttpServletRequest request) {
        User current = (User) request.getSession().getAttribute("currentUser");
        if (current == null || !"ADMIN".equals(current.getRole())) {
            throw new RuntimeException("权限不足");
        }
        return current;
    }
}
