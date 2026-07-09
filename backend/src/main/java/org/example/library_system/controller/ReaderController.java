package org.example.library_system.controller;

import org.example.library_system.common.Result;
import org.example.library_system.entity.Reader;
import org.example.library_system.service.ReaderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/readers")
public class ReaderController {

    @Autowired
    private ReaderService readerService;

    @GetMapping
    public Result<List<Reader>> list(@RequestParam(required = false) String keyword) {
        return Result.success(readerService.list(keyword));
    }

    @GetMapping("/{id}")
    public Result<Reader> getById(@PathVariable Integer id) {
        Reader r = readerService.getById(id);
        if (r == null) return Result.error("读者不存在");
        return Result.success(r);
    }

    @PostMapping
    public Result<Void> save(@RequestBody Reader reader) {
        return readerService.save(reader) ? Result.success() : Result.error("新增失败(姓名不能为空)");
    }

    @PutMapping
    public Result<Void> update(@RequestBody Reader reader) {
        return readerService.update(reader) ? Result.success() : Result.error("修改失败");
    }

    @DeleteMapping("/{id}")
    public Result<Void> remove(@PathVariable Integer id) {
        if (!readerService.removeById(id)) {
            return Result.error("该读者尚有未归还图书,无法删除");
        }
        return Result.success();
    }
}
