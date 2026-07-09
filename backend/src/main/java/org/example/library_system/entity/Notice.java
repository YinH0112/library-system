package org.example.library_system.entity;

import java.time.LocalDateTime;

/**
 * 公告通知实体
 * type: NOTICE(通知) / ANNOUNCEMENT(公告) / MAINTENANCE(维护)
 * status: DRAFT / PUBLISHED / ARCHIVED
 */
public class Notice {
    private Integer id;
    private String title;
    private String content;
    private String type;
    private String status;
    private Integer publisherId;
    private LocalDateTime publishDate;
    private Integer pinned;  // 0/1
    // 关联字段
    private String publisherName;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getPublisherId() { return publisherId; }
    public void setPublisherId(Integer publisherId) { this.publisherId = publisherId; }
    public LocalDateTime getPublishDate() { return publishDate; }
    public void setPublishDate(LocalDateTime publishDate) { this.publishDate = publishDate; }
    public Integer getPinned() { return pinned; }
    public void setPinned(Integer pinned) { this.pinned = pinned; }
    public String getPublisherName() { return publisherName; }
    public void setPublisherName(String publisherName) { this.publisherName = publisherName; }
}
