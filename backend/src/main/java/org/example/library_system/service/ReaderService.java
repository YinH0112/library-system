package org.example.library_system.service;

import org.example.library_system.entity.Reader;

import java.util.List;

public interface ReaderService {
    List<Reader> list(String keyword);
    Reader getById(Integer id);
    boolean save(Reader reader);
    boolean update(Reader reader);
    boolean removeById(Integer id);
}
