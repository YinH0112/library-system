package org.example.library_system.service;

import org.example.library_system.entity.Category;
import org.example.library_system.mapper.CategoryMapper;
import org.example.library_system.service.impl.CategoryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
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
class CategoryServiceImplTest {

    @Mock
    private CategoryMapper categoryMapper;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    @Test
    void list_returnsAllCategories() {
        when(categoryMapper.findAll()).thenReturn(List.of(
                new Category() {{ setId(1); setName("计算机科学"); }},
                new Category() {{ setId(2); setName("文学"); }}
        ));
        assertEquals(2, categoryService.list().size());
    }

    @Test
    void save_insertsWhenNameNotBlank() {
        Category c = new Category();
        c.setName("历史");
        when(categoryMapper.insert(any())).thenReturn(1);
        assertTrue(categoryService.save(c));
    }

    @Test
    void save_rejectsBlankName() {
        Category c = new Category();
        c.setName("  ");
        assertFalse(categoryService.save(c));
        verify(categoryMapper, never()).insert(any());
    }

    @Test
    void removeById_blocksWhenBooksExist() {
        when(categoryMapper.countBooksByCategory(1)).thenReturn(3);
        assertFalse(categoryService.removeById(1));
        verify(categoryMapper, never()).deleteById(anyInt());
    }

    @Test
    void removeById_deletesWhenNoBooks() {
        when(categoryMapper.countBooksByCategory(1)).thenReturn(0);
        when(categoryMapper.deleteById(1)).thenReturn(1);
        assertTrue(categoryService.removeById(1));
    }
}
