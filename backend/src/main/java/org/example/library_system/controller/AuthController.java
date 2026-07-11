package org.example.library_system.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.example.library_system.common.Result;
import org.example.library_system.config.LoginRateLimiter;
import org.example.library_system.dto.AuthDTO;
import org.example.library_system.entity.User;
import org.example.library_system.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private LoginRateLimiter rateLimiter;

    @PostMapping("/login")
    public Result<User> login(@RequestBody AuthDTO authDTO, HttpServletRequest request) {
        String clientIp = getClientIp(request);
        if (!rateLimiter.allow(clientIp)) {
            return Result.error("登录尝试过多，请1分钟后再试");
        }
        User user = authService.login(authDTO);
        if (user == null) {
            return Result.error("用户名或密码错误，或账号已禁用");
        }
        request.getSession().invalidate();
        HttpSession newSession = request.getSession(true);
        newSession.setAttribute("currentUser", user);
        return Result.success(user);
    }

    @PostMapping("/register")
    public Result<User> register(@RequestBody AuthDTO authDTO) {
        User user = authService.register(authDTO);
        if (user == null) {
            return Result.error("用户名已存在");
        }
        return Result.success(user);
    }

    @PostMapping("/logout")
    public Result<Void> logout(HttpServletRequest request) {
        request.getSession().invalidate();
        return Result.success();
    }

    @GetMapping("/current")
    public Result<User> current(HttpServletRequest request) {
        User user = (User) request.getSession().getAttribute("currentUser");
        if (user == null) {
            return Result.error("未登录");
        }
        User fresh = authService.getCurrentUser(user.getId());
        request.getSession().setAttribute("currentUser", fresh);
        return Result.success(fresh);
    }

    @PostMapping("/change-password")
    public Result<Void> changePassword(@RequestBody AuthDTO authDTO, HttpServletRequest request) {
        User current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) {
            return Result.error("未登录");
        }
        if (authService.changePassword(current.getId(), authDTO)) {
            return Result.success();
        }
        return Result.error("原密码错误");
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}