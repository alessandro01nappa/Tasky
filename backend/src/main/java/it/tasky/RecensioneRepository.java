package it.tasky;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecensioneRepository extends JpaRepository<Recensione, Long> {

    Optional<Recensione> findByIncaricoId(Long incaricoId);

    boolean existsByIncaricoId(Long incaricoId);
}
