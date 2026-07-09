package org.example.library_system.service;

import java.util.List;
import java.util.Map;

public interface StatsService {
    Map<String, Object> overview();
    List<Map<String, Object>> booksPerCategory();
    List<Map<String, Object>> topBorrowedBooks(int limit);
    List<Map<String, Object>> recentBorrows(int limit);
    Map<String, Object> readerOverview(Integer readerId);
}
