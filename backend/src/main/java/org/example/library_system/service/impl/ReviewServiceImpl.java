package org.example.library_system.service.impl;

import org.example.library_system.entity.Review;
import org.example.library_system.mapper.BorrowMapper;
import org.example.library_system.mapper.ReviewMapper;
import org.example.library_system.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ReviewServiceImpl implements ReviewService {

    @Autowired
    private ReviewMapper reviewMapper;
    @Autowired
    private BorrowMapper borrowMapper;

    @Override
    public List<Review> listByBook(Integer bookId) {
        return reviewMapper.findByBookId(bookId);
    }

    @Override
    public List<Review> listByReader(Integer readerId) {
        return reviewMapper.findByReaderId(readerId);
    }

    @Override
    public Result submit(Review review) {
        if (review.getBookId() == null || review.getReaderId() == null) {
            return new Result(false, "图书或读者为空");
        }
        if (review.getRating() == null || review.getRating() < 1 || review.getRating() > 5) {
            return new Result(false, "评分须为 1-5");
        }
        // 校验:读者必须借过该书才能评价
        var borrows = borrowMapper.findAll(null, review.getReaderId());
        boolean hasBorrowed = borrows.stream().anyMatch(b -> b.getBookId().equals(review.getBookId()));
        if (!hasBorrowed) {
            return new Result(false, "只能评价已借阅过的图书");
        }
        // 已存在则更新
        Review existing = reviewMapper.findByBookAndReader(review.getBookId(), review.getReaderId());
        if (existing != null) {
            existing.setRating(review.getRating());
            existing.setContent(review.getContent());
            reviewMapper.update(existing);
            return new Result(true, "评价已更新");
        }
        reviewMapper.insert(review);
        return new Result(true, "评价已提交");
    }

    @Override
    public boolean removeById(Integer id, Integer currentReaderId, boolean isAdmin) {
        Review r = reviewMapper.findById(id);
        if (r == null) return false;
        if (!isAdmin && !r.getReaderId().equals(currentReaderId)) return false;
        return reviewMapper.deleteById(id) > 0;
    }

    @Override
    public Double avgRating(Integer bookId) {
        return reviewMapper.avgRatingByBook(bookId);
    }

    @Override
    public List<Map<String, Object>> ratingDistribution(Integer bookId) {
        return reviewMapper.ratingDistributionByBook(bookId);
    }

    @Override
    public Review findByBookAndReader(Integer bookId, Integer readerId) {
        return reviewMapper.findByBookAndReader(bookId, readerId);
    }
}
