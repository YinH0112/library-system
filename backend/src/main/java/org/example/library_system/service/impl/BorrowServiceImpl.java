package org.example.library_system.service.impl;

import org.example.library_system.dto.BorrowAction;
import org.example.library_system.entity.Book;
import org.example.library_system.entity.Borrow;
import org.example.library_system.mapper.BookMapper;
import org.example.library_system.mapper.BorrowMapper;
import org.example.library_system.service.BorrowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class BorrowServiceImpl implements BorrowService {

    private static final int MAX_ACTIVE_BORROWS = 5;
    private static final BigDecimal FINE_PER_DAY = new BigDecimal("1.00");

    @Autowired
    private BookMapper bookMapper;
    @Autowired
    private BorrowMapper borrowMapper;

    @Override
    @Transactional
    public Result borrow(BorrowAction action) {
        Book book = bookMapper.findById(action.bookId());
        if (book == null) {
            return new Result(false, "图书不存在", null);
        }
        if (book.getStock() == null || book.getStock() <= 0) {
            return new Result(false, "库存不足,无法借出", null);
        }
        int active = borrowMapper.countActiveByReader(action.readerId());
        if (active >= MAX_ACTIVE_BORROWS) {
            return new Result(false, "已达借阅上限(" + MAX_ACTIVE_BORROWS + " 本)", null);
        }

        int affected = bookMapper.decreaseStock(action.bookId());
        if (affected == 0) {
            return new Result(false, "库存竞争失败,请重试", null);
        }

        LocalDate today = LocalDate.now();
        LocalDate due = action.computeDueDate(today);

        Borrow record = new Borrow();
        record.setBookId(action.bookId());
        record.setReaderId(action.readerId());
        record.setBorrowDate(today);
        record.setDueDate(due);
        record.setStatus("BORROWED");
        record.setFine(BigDecimal.ZERO);
        borrowMapper.insert(record);

        return new Result(true, "借出成功,应还日期 " + due, null);
    }

    @Override
    @Transactional
    public Result returnBook(Integer borrowId) {
        Borrow borrow = borrowMapper.findById(borrowId);
        if (borrow == null) {
            return new Result(false, "借阅记录不存在", null);
        }
        if ("RETURNED".equals(borrow.getStatus())) {
            return new Result(false, "该书已归还", null);
        }

        LocalDate today = LocalDate.now();
        BigDecimal fine = BigDecimal.ZERO;
        String newStatus = "RETURNED";

        if (borrow.getDueDate() != null && today.isAfter(borrow.getDueDate())) {
            long days = ChronoUnit.DAYS.between(borrow.getDueDate(), today);
            fine = FINE_PER_DAY.multiply(BigDecimal.valueOf(days));
            newStatus = "RETURNED";
        }

        borrowMapper.updateReturn(borrowId, today, newStatus, fine);
        bookMapper.increaseStock(borrow.getBookId());

        String msg = fine.compareTo(BigDecimal.ZERO) > 0
                ? "归还成功,逾期 " + fine + " 元"
                : "归还成功";
        return new Result(true, msg, fine);
    }

    @Override
    public List<Borrow> list(String status, Integer readerId) {
        return borrowMapper.findAll(status, readerId);
    }

    @Override
    public Borrow getById(Integer id) {
        return borrowMapper.findById(id);
    }
}