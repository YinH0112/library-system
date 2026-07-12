package org.example.library_system.service.impl;

import org.example.library_system.dto.BorrowAction;
import org.example.library_system.entity.Book;
import org.example.library_system.entity.BorrowRequest;
import org.example.library_system.mapper.BookMapper;
import org.example.library_system.mapper.BorrowMapper;
import org.example.library_system.mapper.BorrowRequestMapper;
import org.example.library_system.service.BorrowRequestService;
import org.example.library_system.service.BorrowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class BorrowRequestServiceImpl implements BorrowRequestService {

    private static final int MAX_PENDING_PER_READER = 3;
    private static final int DEFAULT_DUE_DAYS = 30;
    private static final int MAX_DUE_DAYS = 90;

    @Autowired
    private BorrowRequestMapper requestMapper;
    @Autowired
    private BookMapper bookMapper;
    @Autowired
    private BorrowMapper borrowMapper;
    @Autowired
    private BorrowService borrowService;

    @Override
    public Result apply(BorrowRequest request) {
        if (request.getBookId() == null || request.getReaderId() == null) {
            return new Result(false, "图书或读者为空", null);
        }
        var book = bookMapper.findById(request.getBookId());
        if (book == null) {
            return new Result(false, "图书不存在", null);
        }
        var existing = requestMapper.findAll("PENDING", request.getReaderId());
        for (var er : existing) {
            if (er.getBookId().equals(request.getBookId())) {
                return new Result(false, "该书已有待审批申请,请勿重复申请", null);
            }
        }
        if (existing.size() >= MAX_PENDING_PER_READER) {
            return new Result(false, "待审批申请已达上限(" + MAX_PENDING_PER_READER + " 个)", null);
        }
        if (request.getDueDays() == null || request.getDueDays() <= 0) {
            request.setDueDays(DEFAULT_DUE_DAYS);
        }
        if (request.getDueDays() > MAX_DUE_DAYS) {
            return new Result(false, "借阅天数不能超过 " + MAX_DUE_DAYS + " 天", null);
        }
        var active = borrowMapper.countActiveByReader(request.getReaderId());
        if (active + existing.size() >= 5) {
            return new Result(false, "借阅总数达上限(5 本,含申请中)", null);
        }

        request.setRequestDate(LocalDate.now());
        request.setStatus("PENDING");
        requestMapper.insert(request);
        return new Result(true, "申请已提交,等待管理员审批", null);
    }

    @Override
    @Transactional
    public Result approve(Integer requestId, Integer adminId, String adminRemark) {
        var req = requestMapper.findById(requestId);
        if (req == null) {
            return new Result(false, "申请不存在", null);
        }
        if (!"PENDING".equals(req.getStatus())) {
            return new Result(false, "该申请已处理", null);
        }
        var book = bookMapper.findById(req.getBookId());
        if (book == null || book.getStock() == null || book.getStock() <= 0) {
            requestMapper.updateApprove(requestId, "REJECTED", LocalDate.now(), adminId,
                    "库存不足,自动拒绝:" + (adminRemark == null ? "" : adminRemark), null);
            return new Result(false, "库存不足,已自动拒绝该申请", null);
        }
        var dueDays = req.getDueDays() != null ? req.getDueDays() : DEFAULT_DUE_DAYS;
        var action = new BorrowAction(req.getBookId(), req.getReaderId(), dueDays);
        var br = borrowService.borrow(action);
        if (!br.isSuccess()) {
            return new Result(false, "借出失败:" + br.getMessage(), null);
        }
        var list = borrowMapper.findAll("BORROWED", req.getReaderId());
        var newBorrowId = list.isEmpty() ? null : list.get(0).getId();

        requestMapper.updateApprove(requestId, "APPROVED", LocalDate.now(), adminId,
                adminRemark, newBorrowId);
        return new Result(true, "已批准,图书已借出", newBorrowId);
    }

    @Override
    public Result reject(Integer requestId, Integer adminId, String adminRemark) {
        var req = requestMapper.findById(requestId);
        if (req == null) {
            return new Result(false, "申请不存在", null);
        }
        if (!"PENDING".equals(req.getStatus())) {
            return new Result(false, "该申请已处理", null);
        }
        requestMapper.updateApprove(requestId, "REJECTED", LocalDate.now(), adminId,
                adminRemark, null);
        return new Result(true, "已拒绝该申请", null);
    }

    @Override
    public Result cancel(Integer requestId, Integer readerId) {
        var req = requestMapper.findById(requestId);
        if (req == null) {
            return new Result(false, "申请不存在", null);
        }
        if (!req.getReaderId().equals(readerId)) {
            return new Result(false, "无权取消他人申请", null);
        }
        if (!"PENDING".equals(req.getStatus())) {
            return new Result(false, "只能取消待审批申请", null);
        }
        requestMapper.updateStatus(requestId, "CANCELLED");
        return new Result(true, "申请已取消", null);
    }

    @Override
    public List<BorrowRequest> list(String status, Integer readerId) {
        return requestMapper.findAll(status, readerId);
    }

    @Override
    public BorrowRequest getById(Integer id) {
        return requestMapper.findById(id);
    }

    @Override
    public int countPending() {
        return requestMapper.countPending();
    }
}