package it.tasky;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IncaricoRepository extends JpaRepository<Incarico, Long> {

    Optional<Incarico> findByRichiestaId(Long richiestaId);

    List<Incarico> findByRichiestaClienteId(Long clienteId);

    List<Incarico> findByProfiloFornitoreUtenteId(Long utenteId);
}
