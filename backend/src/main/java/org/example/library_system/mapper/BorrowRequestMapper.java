package org.example.library_system.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.library_system.entity.BorrowRequest;

import java.util.List;

@Mapper
public interface BorrowRequestMapper {
    List<BorrowRequest> findAll(@Param("status") String status, @Param("readerId") Integer readerId);
    BorrowRequest findById(Integer id);
    int insert(BorrowRequest request);
    int updateApprove(@Param("id") Integer id, @Param("status") String status,
                      @Param("approveDate") java.time.LocalDate approveDate,
                      @Param("adminId") Integer adminId,
                      @Param("adminRemark") String adminRemark,
                      @Param("borrowId") Integer borrowId);
    int updateStatus(@Param("id") Integer id, @Param("status") String status);
    int countPendingByReader(Integer readerId);
    int countPending();
}
