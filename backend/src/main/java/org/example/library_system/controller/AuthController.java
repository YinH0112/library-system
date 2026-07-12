package org.example.library_system.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.example.library_system.common.Result;
import org.example.library_system.config.LoginRateLimiter;
import org.example.library_system.dto.AuthDTO;
import org.example.library_system.entity.User;
import org.example.library_system.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private LoginRateLimiter rateLimiter;

    @PostMapping("/login")
    public Result<User> login(@RequestBody AuthDTO authDTO, HttpServletRequest request) {
        var clientIp = getClientIp(request);
        if (rateLimiter.isBlocked(clientIp)) {
            return Result.error("登录尝试过多，请1分钟后再试");
        }
        var user = authService.login(authDTO);
        if (user == null) {
            rateLimiter.recordFailure(clientIp);
            return Result.error("用户名或密码错误，或账号已禁用");
        }
        rateLimiter.reset(clientIp);
        request.getSession().invalidate();
        var newSession = request.getSession(true);
        newSession.setAttribute("currentUser", user);
        return Result.success(user);
    }

    @PostMapping("/register")
    public Result<User> register(@RequestBody AuthDTO authDTO) {
        return Optional.ofNullable(authService.register(authDTO))
                .map(Result::success)
                .orElseGet(() -> Result.error("用户名已存在"));
    }

    @PostMapping("/logout")
    public Result<Void> logout(HttpServletRequest request) {
        request.getSession().invalidate();
        return Result.success();
    }

    @GetMapping("/current")
    public Result<User> current(HttpServletRequest request) {
        var current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        var fresh = authService.getCurrentUser(current.getId());
        if (fresh == null) {
            request.getSession().invalidate();
            return Result.error("账号已被禁用或删除");
        }
        request.getSession().setAttribute("currentUser", fresh);
        return Result.success(fresh);
    }

    @PostMapping("/change-password")
    public Result<Void> changePassword(@RequestBody AuthDTO authDTO, HttpServletRequest request) {
        var current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        return authService.changePassword(current.getId(), authDTO)
                ? Result.success() : Result.error("原密码错误");
    }

    private String getClientIp(HttpServletRequest request) {
        var xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}