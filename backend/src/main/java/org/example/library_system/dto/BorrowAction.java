package org.example.library_system.dto;

import java.time.LocalDate;

public class BorrowAction {
    private Integer bookId;
    private Integer readerId;
    private Integer days; // 借阅天数,默认 30

    public Integer getBookId() { return bookId; }
    public void setBookId(Integer bookId) { this.bookId = bookId; }
    public Integer getReaderId() { return readerId; }
    public void setReaderId(Integer readerId) { this.readerId = readerId; }
    public Integer getDays() { return days; }
    public void setDays(Integer days) { this.days = days; }

    public LocalDate computeDueDate(LocalDate borrowDate) {
        int d = days == null || days <= 0 ? 30 : days;
        return borrowDate.plusDays(d);
    }
}
