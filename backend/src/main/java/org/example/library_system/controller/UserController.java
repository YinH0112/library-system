package org.example.library_system.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.example.library_system.common.Result;
import org.example.library_system.dto.AuthDTO;
import org.example.library_system.entity.User;
import org.example.library_system.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private AuthService authService;

    @GetMapping
    public Result<List<User>> list(@RequestParam(required = false) String role,
                                   HttpServletRequest request) {
        requireAdmin(request);
        return Result.success(authService.listUsers(role));
    }

    @GetMapping("/{id}")
    public Result<User> getById(@PathVariable Integer id, HttpServletRequest request) {
        requireAdmin(request);
        return Result.success(authService.getById(id));
    }

    @PostMapping
    public Result<Void> add(@RequestBody AuthDTO authDTO, HttpServletRequest request) {
        requireAdmin(request);
        var user = authService.register(authDTO);
        return user != null ? Result.success() : Result.error("用户名已存在");
    }

    @PutMapping("/{id}/status")
    public Result<Void> toggleStatus(@PathVariable Integer id, HttpServletRequest request) {
        requireAdmin(request);
        return authService.toggleStatus(id) ? Result.success() : Result.error("操作失败");
    }

    @DeleteMapping("/{id}")
    public Result<Void> remove(@PathVariable Integer id, HttpServletRequest request) {
        requireAdmin(request);
        var current = (User) request.getSession().getAttribute("currentUser");
        if (current != null && current.getId().equals(id)) {
            return Result.error("不能删除当前登录账号");
        }
        return authService.removeUser(id) ? Result.success() : Result.error("删除失败(可能是不允许删除最后一个管理员)");
    }

    private void requireAdmin(HttpServletRequest request) {
        Optional.ofNullable((User) request.getSession().getAttribute("currentUser"))
                .filter(u -> "ADMIN".equals(u.getRole()))
                .orElseThrow(() -> new RuntimeException("权限不足"));
    }
}