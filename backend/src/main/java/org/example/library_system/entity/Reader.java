package org.example.library_system.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class Reader {
    private Integer id;
    private String name;
    private String studentId;
    private String phone;
    private String email;
    private String status; // ACTIVE / SUSPENDED
    private LocalDate registerDate;
    private LocalDateTime createTime;
    // 关联统计(非数据库列)
    private Integer activeBorrowCount;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getRegisterDate() { return registerDate; }
    public void setRegisterDate(LocalDate registerDate) { this.registerDate = registerDate; }
    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }
    public Integer getActiveBorrowCount() { return activeBorrowCount; }
    public void setActiveBorrowCount(Integer activeBorrowCount) { this.activeBorrowCount = activeBorrowCount; }
}
