import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
public class GenHash {
    public static void main(String[] args) {
        BCryptPasswordEncoder enc = new BCryptPasswordEncoder();
        System.out.println("ADMIN_HASH=" + enc.encode("admin123"));
        System.out.println("READER_HASH=" + enc.encode("reader123"));
    }
}