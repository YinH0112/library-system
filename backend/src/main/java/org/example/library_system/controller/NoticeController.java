package org.example.library_system.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.example.library_system.common.Result;
import org.example.library_system.entity.Notice;
import org.example.library_system.entity.User;
import org.example.library_system.service.NoticeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/notices")
public class NoticeController {

    @Autowired
    private NoticeService noticeService;

    @GetMapping("/published")
    public Result<List<Notice>> listPublished(@RequestParam(required = false) String type) {
        return Result.success(noticeService.listPublished(type));
    }

    @GetMapping("/pinned")
    public Result<List<Notice>> pinned() {
        var all = noticeService.listPublished(null);
        return Result.success(all.stream().filter(n -> n.getPinned() != null && n.getPinned() == 1).toList());
    }

    @GetMapping
    public Result<List<Notice>> listAll(@RequestParam(required = false) String type,
                                        HttpServletRequest request) {
        requireAdmin(request);
        return Result.success(noticeService.listAll(type));
    }

    @GetMapping("/{id}")
    public Result<Notice> getById(@PathVariable Integer id) {
        return Optional.ofNullable(noticeService.getById(id))
                .map(Result::success)
                .orElseGet(() -> Result.error("公告不存在"));
    }

    @PostMapping
    public Result<Void> create(@RequestBody Notice notice, HttpServletRequest request) {
        var current = requireAdmin(request);
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
        return Optional.ofNullable((User) request.getSession().getAttribute("currentUser"))
                .filter(u -> "ADMIN".equals(u.getRole()))
                .orElseThrow(() -> new RuntimeException("权限不足"));
    }
}