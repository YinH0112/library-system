package org.example.library_system.common;

public record Result<T>(Integer code, String message, T data) {

    public static <T> Result<T> success(T data) {
        return new Result<>(200, "success", data);
    }

    public static <T> Result<T> success() {
        return new Result<>(200, "success", null);
    }

    public static <T> Result<T> error(String message) {
        return new Result<>(500, message, null);
    }
}