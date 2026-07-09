package org.example.library_system.service.impl;

import org.example.library_system.mapper.BookMapper;
import org.example.library_system.mapper.BorrowMapper;
import org.example.library_system.mapper.CategoryMapper;
import org.example.library_system.mapper.ReaderMapper;
import org.example.library_system.service.StatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class StatsServiceImpl implements StatsService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public Map<String, Object> overview() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("bookCount", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM book", Integer.class));
        stats.put("totalStock", jdbcTemplate.queryForObject("SELECT COALESCE(SUM(total_stock),0) FROM book", Integer.class));
        stats.put("availableStock", jdbcTemplate.queryForObject("SELECT COALESCE(SUM(stock),0) FROM book", Integer.class));
        stats.put("readerCount", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM reader", Integer.class));
        stats.put("activeBorrows", jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM borrow WHERE status IN ('BORROWED','OVERDUE')", Integer.class));
        stats.put("overdueCount", jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM borrow WHERE status = 'OVERDUE'", Integer.class));
        stats.put("categoryCount", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM category", Integer.class));
        stats.put("totalFine", jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(fine),0) FROM borrow", java.math.BigDecimal.class));
        return stats;
    }

    @Override
    public List<Map<String, Object>> booksPerCategory() {
        return jdbcTemplate.queryForList(
                "SELECT c.name AS category, COUNT(b.id) AS count " +
                "FROM category c LEFT JOIN book b ON b.category_id = c.id " +
                "GROUP BY c.id, c.name ORDER BY count DESC");
    }

    @Override
    public List<Map<String, Object>> topBorrowedBooks(int limit) {
        return jdbcTemplate.queryForList(
                "SELECT b.name AS book, COUNT(br.id) AS borrow_count " +
                "FROM book b LEFT JOIN borrow br ON br.book_id = b.id " +
                "GROUP BY b.id, b.name ORDER BY borrow_count DESC LIMIT ?",
                limit);
    }

    @Override
    public List<Map<String, Object>> recentBorrows(int limit) {
        return jdbcTemplate.queryForList(
                "SELECT br.id, b.name AS book, r.name AS reader, br.borrow_date, br.due_date, br.status " +
                "FROM borrow br LEFT JOIN book b ON br.book_id = b.id " +
                "LEFT JOIN reader r ON br.reader_id = r.id " +
                "ORDER BY br.id DESC LIMIT ?", limit);
    }

    @Override
    public Map<String, Object> readerOverview(Integer readerId) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBorrows", jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM borrow WHERE reader_id = ?", Integer.class, readerId));
        stats.put("activeBorrows", jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM borrow WHERE reader_id = ? AND status IN ('BORROWED','OVERDUE')", Integer.class, readerId));
        stats.put("overdueCount", jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM borrow WHERE reader_id = ? AND status = 'OVERDUE'", Integer.class, readerId));
        stats.put("returnedCount", jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM borrow WHERE reader_id = ? AND status = 'RETURNED'", Integer.class, readerId));
        stats.put("totalFine", jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(fine),0) FROM borrow WHERE reader_id = ?", java.math.BigDecimal.class, readerId));
        return stats;
    }
}
