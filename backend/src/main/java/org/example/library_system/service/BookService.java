package org.example.library_system.service;

import org.example.library_system.common.PageResult;
import org.example.library_system.dto.BookQuery;
import org.example.library_system.entity.Book;

import java.util.List;

public interface BookService {

    List<Book> list(String name);

    PageResult<Book> page(BookQuery query);

    Book getById(Integer id);

    boolean save(Book book);

    boolean update(Book book);

    boolean removeById(Integer id);
}
