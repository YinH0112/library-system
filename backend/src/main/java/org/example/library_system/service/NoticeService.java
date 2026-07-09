package org.example.library_system.service;

import org.example.library_system.entity.Notice;

import java.util.List;

public interface NoticeService {
    List<Notice> listPublished(String type);
    List<Notice> listAll(String type);
    Notice getById(Integer id);
    boolean save(Notice notice);
    boolean update(Notice notice);
    boolean removeById(Integer id);
    boolean togglePinned(Integer id, boolean pinned);
}
