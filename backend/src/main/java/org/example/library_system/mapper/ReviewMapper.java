package org.example.library_system.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.library_system.entity.Review;

import java.util.List;
import java.util.Map;

@Mapper
public interface ReviewMapper {
    List<Review> findByBookId(Integer bookId);
    List<Review> findByReaderId(Integer readerId);
    Review findById(Integer id);
    /** 同一读者对同一本书的评价(应为 0 或 1) */
    Review findByBookAndReader(@Param("bookId") Integer bookId, @Param("readerId") Integer readerId);
    int insert(Review review);
    int update(Review review);
    int deleteById(Integer id);
    /** 图书平均评分 */
    Double avgRatingByBook(Integer bookId);
    /** 各评分分布 [{rating:5, count:3}, ...] */
    List<Map<String, Object>> ratingDistributionByBook(Integer bookId);
}
