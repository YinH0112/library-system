package org.example.library_system.service.impl;

import org.example.library_system.entity.Reader;
import org.example.library_system.mapper.ReaderMapper;
import org.example.library_system.service.ReaderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ReaderServiceImpl implements ReaderService {

    @Autowired
    private ReaderMapper readerMapper;

    @Override
    public List<Reader> list(String keyword) {
        return readerMapper.findAll(keyword);
    }

    @Override
    public Reader getById(Integer id) {
        return readerMapper.findById(id);
    }

    @Override
    public boolean save(Reader reader) {
        if (reader.getName() == null || reader.getName().trim().isEmpty()) {
            return false;
        }
        if (reader.getStatus() == null) {
            reader.setStatus("ACTIVE");
        }
        if (reader.getRegisterDate() == null) {
            reader.setRegisterDate(LocalDate.now());
        }
        return readerMapper.insert(reader) > 0;
    }

    @Override
    public boolean update(Reader reader) {
        return readerMapper.update(reader) > 0;
    }

    @Override
    public boolean removeById(Integer id) {
        Reader r = readerMapper.findById(id);
        if (r == null) return false;
        if (r.getActiveBorrowCount() != null && r.getActiveBorrowCount() > 0) {
            return false;
        }
        return readerMapper.deleteById(id) > 0;
    }
}
