package org.example.library_system.service;

import org.example.library_system.entity.BorrowRequest;

import java.util.List;

public interface BorrowRequestService {

    /** 借阅者发起申请 */
    Result apply(BorrowRequest request);

    /** 管理员批准申请(自动生成借阅记录) */
    Result approve(Integer requestId, Integer adminId, String adminRemark);

    /** 管理员拒绝申请 */
    Result reject(Integer requestId, Integer adminId, String adminRemark);

    /** 借阅者取消自己的申请 */
    Result cancel(Integer requestId, Integer readerId);

    List<BorrowRequest> list(String status, Integer readerId);
    BorrowRequest getById(Integer id);
    int countPending();

    /** 业务结果 */
    class Result {
        private final boolean success;
        private final String message;
        private final Integer borrowId;

        public Result(boolean success, String message, Integer borrowId) {
            this.success = success;
            this.message = message;
            this.borrowId = borrowId;
        }
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public Integer getBorrowId() { return borrowId; }
    }
}
