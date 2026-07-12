const API = (function () {
    let nextId = 8;

    const books = [
        { id: 1, name: '百年孤独', author: '加西亚·马尔克斯', price: 55.00, publisher: '南海出版公司' },
        { id: 2, name: '活着', author: '余华', price: 28.00, publisher: '作家出版社' },
        { id: 3, name: '红楼梦', author: '曹雪芹', price: 68.00, publisher: '人民文学出版社' },
        { id: 4, name: '1984', author: '乔治·奥威尔', price: 32.50, publisher: '上海译文出版社' },
        { id: 5, name: '三体', author: '刘慈欣', price: 45.00, publisher: '重庆出版社' },
        { id: 6, name: '小王子', author: '安托万·德·圣-埃克苏佩里', price: 22.00, publisher: '人民文学出版社' },
        { id: 7, name: '围城', author: '钱钟书', price: 39.00, publisher: '人民文学出版社' }
    ];

    return {
        list(name) {
            const filtered = name
                ? books.filter(b => b.name.includes(name))
                : [...books];
            return Promise.resolve({ data: { code: 200, data: filtered } });
        },
        getById(id) {
            const book = books.find(b => b.id === id) || null;
            return Promise.resolve({ data: { code: 200, data: book } });
        },
        add(book) {
            book.id = nextId++;
            books.push(book);
            return Promise.resolve({ data: { code: 200, data: book } });
        },
        update(book) {
            const idx = books.findIndex(b => b.id === book.id);
            if (idx >= 0) books[idx] = { ...book };
            return Promise.resolve({ data: { code: 200, data: book } });
        },
        remove(id) {
            const idx = books.findIndex(b => b.id === id);
            if (idx >= 0) books.splice(idx, 1);
            return Promise.resolve({ data: { code: 200 } });
        }
    };
})();
