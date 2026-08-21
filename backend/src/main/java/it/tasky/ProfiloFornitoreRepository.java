package it.tasky;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfiloFornitoreRepository extends JpaRepository<ProfiloFornitore, Long> {

    Optional<ProfiloFornitore> findByUtenteId(Long utenteId);

    List<ProfiloFornitore> findByStato(StatoFornitore stato);
}
