package org.example.library_system.service.impl;

import org.example.library_system.entity.Notice;
import org.example.library_system.mapper.NoticeMapper;
import org.example.library_system.service.NoticeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NoticeServiceImpl implements NoticeService {

    @Autowired
    private NoticeMapper noticeMapper;

    @Override
    public List<Notice> listPublished(String type) {
        return noticeMapper.findAll(true, type);
    }

    @Override
    public List<Notice> listAll(String type) {
        return noticeMapper.findAll(false, type);
    }

    @Override
    public Notice getById(Integer id) {
        return noticeMapper.findById(id);
    }

    @Override
    public boolean save(Notice notice) {
        if (notice.getTitle() == null || notice.getTitle().trim().isEmpty()) return false;
        if (notice.getContent() == null || notice.getContent().trim().isEmpty()) return false;
        if (notice.getType() == null) notice.setType("NOTICE");
        if (notice.getStatus() == null) notice.setStatus("PUBLISHED");
        if (notice.getPublishDate() == null) notice.setPublishDate(LocalDateTime.now());
        if (notice.getPinned() == null) notice.setPinned(0);
        return noticeMapper.insert(notice) > 0;
    }

    @Override
    public boolean update(Notice notice) {
        return noticeMapper.update(notice) > 0;
    }

    @Override
    public boolean removeById(Integer id) {
        return noticeMapper.deleteById(id) > 0;
    }

    @Override
    public boolean togglePinned(Integer id, boolean pinned) {
        return noticeMapper.togglePinned(id, pinned ? 1 : 0) > 0;
    }
}
