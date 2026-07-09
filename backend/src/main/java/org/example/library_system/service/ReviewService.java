package org.example.library_system.service;

import org.example.library_system.entity.Review;

import java.util.List;
import java.util.Map;

public interface ReviewService {
    List<Review> listByBook(Integer bookId);
    List<Review> listByReader(Integer readerId);
    /** 提交评价(同一读者对同一本书只能评一次,已存在则更新) */
    Result submit(Review review);
    boolean removeById(Integer id, Integer currentReaderId, boolean isAdmin);
    Double avgRating(Integer bookId);
    List<Map<String, Object>> ratingDistribution(Integer bookId);
    Review findByBookAndReader(Integer bookId, Integer readerId);

    class Result {
        private final boolean success;
        private final String message;
        public Result(boolean success, String message) {
            this.success = success; this.message = message;
        }
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }
}
