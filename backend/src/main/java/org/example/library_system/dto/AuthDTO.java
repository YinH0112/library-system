package org.example.library_system.dto;

public record AuthDTO(
    String username,
    String password,
    String role,
    Integer readerId,
    String oldPassword,
    String newPassword
) {}