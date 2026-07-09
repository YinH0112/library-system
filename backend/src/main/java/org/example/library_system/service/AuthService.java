package org.example.library_system.service;

import org.example.library_system.dto.AuthDTO;
import org.example.library_system.entity.User;

import java.util.List;

public interface AuthService {
    User login(AuthDTO authDTO);
    User register(AuthDTO authDTO);
    boolean changePassword(Integer userId, AuthDTO authDTO);
    List<User> listUsers(String role);
    User getCurrentUser(Integer userId);
    boolean toggleStatus(Integer userId);
    boolean removeUser(Integer userId);
    User getById(Integer id);
}
