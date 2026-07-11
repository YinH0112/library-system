package org.example.library_system.dto;

import java.time.LocalDate;

public record BorrowAction(Integer bookId, Integer readerId, Integer days) {

    public LocalDate computeDueDate(LocalDate borrowDate) {
        int d = days == null || days <= 0 ? 30 : days;
        return borrowDate.plusDays(d);
    }
}