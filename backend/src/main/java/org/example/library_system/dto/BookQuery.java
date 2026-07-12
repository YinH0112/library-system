package org.example.library_system.dto;

public class BookQuery {
    private String name;
    private String author;
    private String publisher;
    private Integer categoryId;
    private Integer page = 1;
    private Integer size = 10;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    public String getPublisher() { return publisher; }
    public void setPublisher(String publisher) { this.publisher = publisher; }
    public Integer getCategoryId() { return categoryId; }
    public void setCategoryId(Integer categoryId) { this.categoryId = categoryId; }
    public Integer getPage() { return page; }
    public void setPage(Integer page) { this.page = page; }
    public Integer getSize() { return size; }
    public void setSize(Integer size) { this.size = size; }

    public int getOffset() {
        int p = page == null ? 1 : page;
        int s = size == null ? 10 : size;
        return Math.max(0, (p - 1) * s);
    }
}