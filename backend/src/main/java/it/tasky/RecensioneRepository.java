package it.tasky;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecensioneRepository extends JpaRepository<Recensione, Long> {

    Optional<Recensione> findByIncaricoId(Long incaricoId);

    List<Recensione> findByIncaricoProfiloFornitoreId(Long profiloFornitoreId);

    boolean existsByIncaricoId(Long incaricoId);
}
