// API service module - wraps axios calls to the backend REST API.
// Base URL points to the Spring Boot backend.
const API = (function () {
    const client = axios.create({
        baseURL: 'http://localhost:8080/api/books',
        timeout: 10000
    });

    return {
        // Feature 1 & 5: list all, or search by name
        list(name) {
            const params = {};
            if (name) {
                params.name = name;
            }
            return client.get('', { params });
        },
        // Get one book by id (used by edit form)
        getById(id) {
            return client.get('/' + id);
        },
        // Feature 2: add a new book
        add(book) {
            return client.post('', book);
        },
        // Feature 3: update an existing book
        update(book) {
            return client.put('', book);
        },
        // Feature 4: delete a book by id
        remove(id) {
            return client.delete('/' + id);
        }
    };
})();
