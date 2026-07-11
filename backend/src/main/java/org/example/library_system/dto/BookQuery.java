package org.example.library_system.dto;

public record BookQuery(
    String name,
    String author,
    String publisher,
    Integer categoryId,
    Integer page,
    Integer size
) {
    public BookQuery {
        if (page == null) page = 1;
        if (size == null) size = 10;
    }

    public int getOffset() {
        int p = page == null ? 1 : page;
        int s = size == null ? 10 : size;
        return Math.max(0, (p - 1) * s);
    }
}