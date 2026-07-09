package org.example.library_system.service;

import org.example.library_system.entity.Reader;
import org.example.library_system.mapper.ReaderMapper;
import org.example.library_system.service.impl.ReaderServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReaderServiceImplTest {

    @Mock
    private ReaderMapper readerMapper;

    @InjectMocks
    private ReaderServiceImpl readerService;

    @Test
    void list_passesKeywordToMapper() {
        when(readerMapper.findAll("张")).thenReturn(List.of(new Reader()));
        assertEquals(1, readerService.list("张").size());
    }

    @Test
    void save_rejectsBlankName() {
        Reader r = new Reader();
        r.setName("");
        assertFalse(readerService.save(r));
        verify(readerMapper, never()).insert(any());
    }

    @Test
    void save_defaultsStatusAndRegisterDate() {
        Reader r = new Reader();
        r.setName("赵六");
        when(readerMapper.insert(any())).thenReturn(1);
        assertTrue(readerService.save(r));
        assertEquals("ACTIVE", r.getStatus());
        assertNotNull(r.getRegisterDate());
    }

    @Test
    void removeById_blocksWhenActiveBorrowsExist() {
        when(readerMapper.findById(1)).thenReturn(new Reader() {{ setActiveBorrowCount(2); }});
        assertFalse(readerService.removeById(1));
        verify(readerMapper, never()).deleteById(anyInt());
    }
}
