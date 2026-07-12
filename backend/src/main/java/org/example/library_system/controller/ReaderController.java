package org.example.library_system.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.example.library_system.common.Result;
import org.example.library_system.entity.Reader;
import org.example.library_system.entity.User;
import org.example.library_system.service.ReaderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/readers")
public class ReaderController {

    @Autowired
    private ReaderService readerService;

    @GetMapping
    public Result<List<Reader>> list(@RequestParam(required = false) String keyword, HttpServletRequest request) {
        var current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        if (!"ADMIN".equals(current.getRole())) return Result.error("权限不足");
        return Result.success(readerService.list(keyword));
    }

    @GetMapping("/{id}")
    public Result<Reader> getById(@PathVariable Integer id, HttpServletRequest request) {
        var current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        if ("READER".equals(current.getRole()) && !id.equals(current.getReaderId()))
            return Result.error("无权查看他人信息");
        return Optional.ofNullable(readerService.getById(id))
                .map(Result::success)
                .orElseGet(() -> Result.error("读者不存在"));
    }

    @PostMapping
    public Result<Void> save(@RequestBody Reader reader, HttpServletRequest request) {
        requireAdmin(request);
        return readerService.save(reader) ? Result.success() : Result.error("新增失败(姓名不能为空)");
    }

    @PutMapping
    public Result<Void> update(@RequestBody Reader reader, HttpServletRequest request) {
        requireAdmin(request);
        return readerService.update(reader) ? Result.success() : Result.error("修改失败");
    }

    @DeleteMapping("/{id}")
    public Result<Void> remove(@PathVariable Integer id, HttpServletRequest request) {
        requireAdmin(request);
        if (!readerService.removeById(id)) {
            return Result.error("该读者尚有未归还图书,无法删除");
        }
        return Result.success();
    }

    private void requireAdmin(HttpServletRequest request) {
        Optional.ofNullable((User) request.getSession().getAttribute("currentUser"))
                .filter(u -> "ADMIN".equals(u.getRole()))
                .orElseThrow(() -> new RuntimeException("权限不足"));
    }
}