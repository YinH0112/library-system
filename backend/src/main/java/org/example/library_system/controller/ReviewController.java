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

/**
 * 图书评价控制器
 * - 借阅者: 提交/更新评价(只能评借过的书)、查看自己评价、删除自己评价
 * - 所有人: 查看图书评价列表、平均分、分布
 */
@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    /** 某本图书的评价列表 */
    @GetMapping("/book/{bookId}")
    public Result<List<Review>> listByBook(@PathVariable Integer bookId) {
        return Result.success(reviewService.listByBook(bookId));
    }

    /** 某本图书的评分汇总(平均分 + 分布) */
    @GetMapping("/book/{bookId}/summary")
    public Result<Map<String, Object>> summary(@PathVariable Integer bookId) {
        Map<String, Object> m = new HashMap<>();
        Double avg = reviewService.avgRating(bookId);
        m.put("avgRating", avg != null ? Math.round(avg * 10) / 10.0 : 0);
        m.put("distribution", reviewService.ratingDistribution(bookId));
        m.put("total", reviewService.listByBook(bookId).size());
        return Result.success(m);
    }

    /** 借阅者查看自己的评价 */
    @GetMapping("/my")
    public Result<List<Review>> myReviews(HttpServletRequest request) {
        User current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        if (!"READER".equals(current.getRole()) || current.getReaderId() == null) {
            return Result.error("仅借阅者可访问");
        }
        return Result.success(reviewService.listByReader(current.getReaderId()));
    }

    /** 借阅者查询自己对某书的评价(用于前端"已评价"提示) */
    @GetMapping("/my/{bookId}")
    public Result<Review> myReviewForBook(@PathVariable Integer bookId, HttpServletRequest request) {
        User current = (User) request.getSession().getAttribute("currentUser");
        if (current == null || current.getReaderId() == null) return Result.error("未登录");
        return Result.success(reviewService.findByBookAndReader(bookId, current.getReaderId()));
    }

    /** 借阅者提交/更新评价 */
    @PostMapping
    public Result<Void> submit(@RequestBody Review review, HttpServletRequest request) {
        User current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        if (!"READER".equals(current.getRole()) || current.getReaderId() == null) {
            return Result.error("仅借阅者可评价");
        }
        review.setReaderId(current.getReaderId());
        ReviewService.Result r = reviewService.submit(review);
        return r.isSuccess() ? Result.success() : Result.error(r.getMessage());
    }

    @DeleteMapping("/{id}")
    public Result<Void> remove(@PathVariable Integer id, HttpServletRequest request) {
        User current = (User) request.getSession().getAttribute("currentUser");
        if (current == null) return Result.error("未登录");
        boolean isAdmin = "ADMIN".equals(current.getRole());
        Integer readerId = current.getReaderId();
        return reviewService.removeById(id, readerId, isAdmin)
                ? Result.success() : Result.error("删除失败(无权删除或评价不存在)");
    }
}
