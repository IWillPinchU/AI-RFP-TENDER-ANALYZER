package com.dce.rfp.repository;
import com.dce.rfp.entity.VerificationToken;
import com.dce.rfp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    Optional<VerificationToken> findByToken(String token);
    void deleteByUser(User user);
}