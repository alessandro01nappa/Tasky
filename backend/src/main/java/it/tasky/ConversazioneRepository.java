package it.tasky;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversazioneRepository extends JpaRepository<Conversazione, Long> {

    Optional<Conversazione> findByIncaricoId(Long incaricoId);
}
