package org.example.library_system.service;

import org.example.library_system.dto.BorrowAction;
import org.example.library_system.entity.Borrow;

import java.math.BigDecimal;
import java.util.List;

public interface BorrowService {

    Result borrow(BorrowAction action);

    Result returnBook(Integer borrowId);

    List<Borrow> list(String status, Integer readerId);

    Borrow getById(Integer id);

    /** 借/还操作结果,带业务消息和罚款金额 */
    class Result {
        private final boolean success;
        private final String message;
        private final BigDecimal fine;

        public Result(boolean success, String message, BigDecimal fine) {
            this.success = success;
            this.message = message;
            this.fine = fine;
        }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public BigDecimal getFine() { return fine; }
    }
}
