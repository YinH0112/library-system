package org.example.library_system.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.library_system.entity.Notice;

import java.util.List;

@Mapper
public interface NoticeMapper {
    /** publishedOnly=true: 仅返回 PUBLISHED;按 pinned DESC, publish_date DESC 排序 */
    List<Notice> findAll(@Param("publishedOnly") boolean publishedOnly, @Param("type") String type);
    Notice findById(Integer id);
    int insert(Notice notice);
    int update(Notice notice);
    int deleteById(Integer id);
    int togglePinned(@Param("id") Integer id, @Param("pinned") Integer pinned);
}
