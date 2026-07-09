package org.example.library_system.entity;

import java.time.LocalDateTime;

public class Category {
    private Integer id;
    private String name;
    private String description;
    private LocalDateTime createTime;
    // 关联统计(非数据库列)
    private Integer bookCount;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }
    public Integer getBookCount() { return bookCount; }
    public void setBookCount(Integer bookCount) { this.bookCount = bookCount; }
}
