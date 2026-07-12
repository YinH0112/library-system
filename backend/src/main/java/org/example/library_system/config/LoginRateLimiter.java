package org.example.library_system.config;

import org.springframework.stereotype.Component;

import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_MS = 60_000;

    private final ConcurrentHashMap<String, Deque<Long>> store = new ConcurrentHashMap<>();

    public boolean isBlocked(String key) {
        var now = System.currentTimeMillis();
        var deque = store.get(key);
        if (deque == null) return false;
        synchronized (deque) {
            while (!deque.isEmpty() && now - deque.peekFirst() > WINDOW_MS) {
                deque.pollFirst();
            }
            return deque.size() >= MAX_ATTEMPTS;
        }
    }

    public void recordFailure(String key) {
        var now = System.currentTimeMillis();
        var deque = store.computeIfAbsent(key, k -> new ConcurrentLinkedDeque<>());
        synchronized (deque) {
            deque.addLast(now);
            if (deque.size() > MAX_ATTEMPTS) {
                deque.pollFirst();
            }
        }
        if (store.size() > 10_000) {
            store.entrySet().removeIf(e -> {
                synchronized (e.getValue()) {
                    return e.getValue().isEmpty();
                }
            });
        }
    }

    public void reset(String key) {
        store.remove(key);
    }
}