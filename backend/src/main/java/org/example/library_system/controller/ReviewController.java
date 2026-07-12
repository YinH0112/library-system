package org.example.library_system.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.example.library_system.common.Result;
import org.example.library_system.entity.Review;
import org.example.library_system.entity.User;
import org.example.library_system.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @GetMapping("/book/{bookId}")
    public Result<List<Review>> listByBook(@PathVariable Integer bookId) {
        return Result.success(reviewService.listByBook(bookId));
    }

    @GetMapping("/book/{bookId}/summary")
    public Result<Map<String, Object>> summary(@PathVariable Integer bookId) {
        var m = new HashMap<String, Object>();
        var avg = reviewService.avgRating(bookId);
        m.put("avgRating", avg != null ? Math.round(avg * 10) / 10.0 : 0);
        m.put("distribution", reviewService.ratingDistribution(bookId));
        m.put("total", reviewService.listByBook(bookId).size());
        return Result.success(m);
    }

    @GetMapping("/my")
    public Result<List<Review>> myReviews(HttpServletRequest request) {
        var current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        if (!"READER".equals(current.getRole()) || current.getReaderId() == null)
            return Result.error("仅借阅者可访问");
        return Result.success(reviewService.listByReader(current.getReaderId()));
    }

    @GetMapping("/my/{bookId}")
    public Result<Review> myReviewForBook(@PathVariable Integer bookId, HttpServletRequest request) {
        var current = (User) request.getSession().getAttribute("currentUser");
        if (current == null || current.getReaderId() == null) return Result.error("未登录");
        return Result.success(reviewService.findByBookAndReader(bookId, current.getReaderId()));
    }

    @PostMapping
    public Result<Void> submit(@RequestBody Review review, HttpServletRequest request) {
        var current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        if (!"READER".equals(current.getRole()) || current.getReaderId() == null)
            return Result.error("仅借阅者可评价");
        review.setReaderId(current.getReaderId());
        var r = reviewService.submit(review);
        return r.isSuccess() ? Result.success() : Result.error(r.getMessage());
    }

    @DeleteMapping("/{id}")
    public Result<Void> remove(@PathVariable Integer id, HttpServletRequest request) {
        var current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        var isAdmin = "ADMIN".equals(current.getRole());
        var readerId = current.getReaderId();
        return reviewService.removeById(id, readerId, isAdmin)
                ? Result.success() : Result.error("删除失败(无权删除或评价不存在)");
    }
}