package org.example.library_system.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.library_system.entity.User;

import java.util.List;

@Mapper
public interface UserMapper {
    User findByUsername(@Param("username") String username);
    User findById(Integer id);
    List<User> findAll(@Param("role") String role);
    int insert(User user);
    int updatePassword(@Param("id") Integer id, @Param("password") String password);
    int updateStatus(@Param("id") Integer id, @Param("status") String status);
    int deleteById(Integer id);
}
