package org.example.library_system.service.impl;

import org.example.library_system.dto.AuthDTO;
import org.example.library_system.entity.User;
import org.example.library_system.mapper.UserMapper;
import org.example.library_system.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public User login(AuthDTO authDTO) {
        User user = userMapper.findByUsername(authDTO.getUsername());
        if (user == null) {
            return null;
        }
        if ("DISABLED".equals(user.getStatus())) {
            return null;
        }
        if (!passwordEncoder.matches(authDTO.getPassword(), user.getPassword())) {
            return null;
        }
        // 不返回密码
        user.setPassword(null);
        return user;
    }

    @Override
    public User register(AuthDTO authDTO) {
        // 检查用户名是否已存在
        if (userMapper.findByUsername(authDTO.getUsername()) != null) {
            return null;
        }
        User user = new User();
        user.setUsername(authDTO.getUsername());
        user.setPassword(passwordEncoder.encode(authDTO.getPassword()));
        user.setRole(authDTO.getRole() != null ? authDTO.getRole() : "READER");
        user.setReaderId(authDTO.getReaderId());
        user.setStatus("ACTIVE");
        userMapper.insert(user);
        user.setPassword(null);
        return user;
    }

    @Override
    public boolean changePassword(Integer userId, AuthDTO authDTO) {
        User user = userMapper.findById(userId);
        if (user == null) {
            return false;
        }
        if (!passwordEncoder.matches(authDTO.getOldPassword(), user.getPassword())) {
            return false;
        }
        String encoded = passwordEncoder.encode(authDTO.getNewPassword());
        return userMapper.updatePassword(userId, encoded) > 0;
    }

    @Override
    public List<User> listUsers(String role) {
        List<User> users = userMapper.findAll(role);
        users.forEach(u -> u.setPassword(null));
        return users;
    }

    @Override
    public User getCurrentUser(Integer userId) {
        User user = userMapper.findById(userId);
        if (user != null) {
            user.setPassword(null);
        }
        return user;
    }

    @Override
    public boolean toggleStatus(Integer userId) {
        User user = userMapper.findById(userId);
        if (user == null) return false;
        String newStatus = "ACTIVE".equals(user.getStatus()) ? "DISABLED" : "ACTIVE";
        return userMapper.updateStatus(userId, newStatus) > 0;
    }

    @Override
    public boolean removeUser(Integer userId) {
        User user = userMapper.findById(userId);
        if (user == null) return false;
        // 不允许删除最后一个管理员
        if ("ADMIN".equals(user.getRole())) {
            List<User> admins = userMapper.findAll("ADMIN");
            if (admins.size() <= 1) {
                return false;
            }
        }
        return userMapper.deleteById(userId) > 0;
    }

    @Override
    public User getById(Integer id) {
        User user = userMapper.findById(id);
        if (user != null) {
            user.setPassword(null);
        }
        return user;
    }
}
