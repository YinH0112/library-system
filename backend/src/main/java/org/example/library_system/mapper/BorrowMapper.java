package org.example.library_system.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.library_system.entity.Borrow;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface BorrowMapper {
    List<Borrow> findAll(@Param("status") String status, @Param("readerId") Integer readerId);
    Borrow findById(Integer id);
    int insert(Borrow borrow);
    int updateReturn(@Param("id") Integer id, @Param("returnDate") LocalDate returnDate,
                     @Param("status") String status, @Param("fine") java.math.BigDecimal fine);
    int updateStatus(@Param("id") Integer id, @Param("status") String status);
    int countActiveByReader(Integer readerId);
    int countOverdue();
}
