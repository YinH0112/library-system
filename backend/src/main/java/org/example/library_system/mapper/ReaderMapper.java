package org.example.library_system.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.example.library_system.entity.Reader;

import java.util.List;

@Mapper
public interface ReaderMapper {
    List<Reader> findAll(String keyword);
    Reader findById(Integer id);
    int insert(Reader reader);
    int update(Reader reader);
    int deleteById(Integer id);
}
