package org.example.library_system.service.impl;

import org.example.library_system.common.PageResult;
import org.example.library_system.dto.BookQuery;
import org.example.library_system.entity.Book;
import org.example.library_system.mapper.BookMapper;
import org.example.library_system.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookServiceImpl implements BookService {

    @Autowired
    private BookMapper bookMapper;

    @Override
    public List<Book> list(String name) {
        return bookMapper.findAll(name);
    }

    @Override
    public PageResult<Book> page(BookQuery query) {
        List<Book> records = bookMapper.findByQuery(query);
        long total = bookMapper.countByQuery(query);
        return new PageResult<>(records, total, query.getPage(), query.getSize());
    }

    @Override
    public Book getById(Integer id) {
        return bookMapper.findById(id);
    }

    @Override
    public boolean save(Book book) {
        // 入藏时若未指定 stock,默认等于 totalStock
        if (book.getTotalStock() != null && book.getStock() == null) {
            book.setStock(book.getTotalStock());
        }
        if (book.getTotalStock() == null) {
            book.setTotalStock(1);
        }
        if (book.getStock() == null) {
            book.setStock(1);
        }
        return bookMapper.insert(book) > 0;
    }

    @Override
    public boolean update(Book book) {
        return bookMapper.update(book) > 0;
    }

    @Override
    public boolean removeById(Integer id) {
        return bookMapper.deleteById(id) > 0;
    }
}
