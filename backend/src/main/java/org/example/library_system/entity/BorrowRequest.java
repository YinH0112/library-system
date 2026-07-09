package org.example.library_system.entity;

import java.time.LocalDate;

/**
 * 借阅申请实体
 * 流程: 借阅者发起 PENDING -> 管理员 APPROVED(自动生成 borrow 记录) / REJECTED
 * 状态: PENDING / APPROVED / REJECTED / CANCELLED
 */
public class BorrowRequest {
    private Integer id;
    private Integer bookId;
    private Integer readerId;
    private LocalDate requestDate;
    private Integer dueDays;          // 申请借阅天数
    private String status;            // PENDING / APPROVED / REJECTED / CANCELLED
    private LocalDate approveDate;
    private Integer adminId;          // 审批管理员ID
    private String adminRemark;       // 管理员备注(拒绝理由等)
    private String readerRemark;      // 借阅者备注
    private Integer borrowId;         // 审批通过后生成的借阅记录ID
    // 关联字段(非数据库列)
    private String bookName;
    private String readerName;
    private String adminName;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getBookId() { return bookId; }
    public void setBookId(Integer bookId) { this.bookId = bookId; }
    public Integer getReaderId() { return readerId; }
    public void setReaderId(Integer readerId) { this.readerId = readerId; }
    public LocalDate getRequestDate() { return requestDate; }
    public void setRequestDate(LocalDate requestDate) { this.requestDate = requestDate; }
    public Integer getDueDays() { return dueDays; }
    public void setDueDays(Integer dueDays) { this.dueDays = dueDays; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getApproveDate() { return approveDate; }
    public void setApproveDate(LocalDate approveDate) { this.approveDate = approveDate; }
    public Integer getAdminId() { return adminId; }
    public void setAdminId(Integer adminId) { this.adminId = adminId; }
    public String getAdminRemark() { return adminRemark; }
    public void setAdminRemark(String adminRemark) { this.adminRemark = adminRemark; }
    public String getReaderRemark() { return readerRemark; }
    public void setReaderRemark(String readerRemark) { this.readerRemark = readerRemark; }
    public Integer getBorrowId() { return borrowId; }
    public void setBorrowId(Integer borrowId) { this.borrowId = borrowId; }
    public String getBookName() { return bookName; }
    public void setBookName(String bookName) { this.bookName = bookName; }
    public String getReaderName() { return readerName; }
    public void setReaderName(String readerName) { this.readerName = readerName; }
    public String getAdminName() { return adminName; }
    public void setAdminName(String adminName) { this.adminName = adminName; }
}
