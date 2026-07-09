package org.example.library_system.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.library_system.dto.BookQuery;
import org.example.library_system.entity.Book;

import java.util.List;

@Mapper
public interface BookMapper {

    List<Book> findAll(String name);

    List<Book> findByQuery(BookQuery query);

    long countByQuery(BookQuery query);

    Book findById(Integer id);

    int insert(Book book);

    int update(Book book);

    int deleteById(Integer id);

    int decreaseStock(@Param("id") Integer id);

    int increaseStock(@Param("id") Integer id);
}
