package org.example.library_system.service.impl;

import org.example.library_system.dto.AuthDTO;
import org.example.library_system.entity.User;
import org.example.library_system.mapper.UserMapper;
import org.example.library_system.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public User login(AuthDTO authDTO) {
        return Optional.ofNullable(userMapper.findByUsername(authDTO.username()))
                .filter(u -> !"DISABLED".equals(u.getStatus()))
                .filter(u -> passwordEncoder.matches(authDTO.password(), u.getPassword()))
                .map(u -> { u.setPassword(null); return u; })
                .orElse(null);
    }

    @Override
    public User register(AuthDTO authDTO) {
        if (userMapper.findByUsername(authDTO.username()) != null) {
            return null;
        }
        var user = new User();
        user.setUsername(authDTO.username());
        user.setPassword(passwordEncoder.encode(authDTO.password()));
        user.setRole(Optional.ofNullable(authDTO.role()).orElse("READER"));
        user.setReaderId(authDTO.readerId());
        user.setStatus("ACTIVE");
        userMapper.insert(user);
        user.setPassword(null);
        return user;
    }

    @Override
    public boolean changePassword(Integer userId, AuthDTO authDTO) {
        return Optional.ofNullable(userMapper.findById(userId))
                .filter(u -> passwordEncoder.matches(authDTO.oldPassword(), u.getPassword()))
                .map(u -> userMapper.updatePassword(userId, passwordEncoder.encode(authDTO.newPassword())) > 0)
                .orElse(false);
    }

    @Override
    public List<User> listUsers(String role) {
        var users = userMapper.findAll(role);
        users.forEach(u -> u.setPassword(null));
        return users;
    }

    @Override
    public User getCurrentUser(Integer userId) {
        return Optional.ofNullable(userMapper.findById(userId))
                .map(u -> { u.setPassword(null); return u; })
                .orElse(null);
    }

    @Override
    public boolean toggleStatus(Integer userId) {
        return Optional.ofNullable(userMapper.findById(userId))
                .map(u -> {
                    var newStatus = "ACTIVE".equals(u.getStatus()) ? "DISABLED" : "ACTIVE";
                    return userMapper.updateStatus(userId, newStatus) > 0;
                })
                .orElse(false);
    }

    @Override
    public boolean removeUser(Integer userId) {
        return Optional.ofNullable(userMapper.findById(userId))
                .filter(u -> !"ADMIN".equals(u.getRole()) || userMapper.findAll("ADMIN").size() > 1)
                .map(u -> userMapper.deleteById(userId) > 0)
                .orElse(false);
    }

    @Override
    public User getById(Integer id) {
        return Optional.ofNullable(userMapper.findById(id))
                .map(u -> { u.setPassword(null); return u; })
                .orElse(null);
    }
}