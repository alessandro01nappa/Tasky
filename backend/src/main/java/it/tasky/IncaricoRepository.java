package it.tasky;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IncaricoRepository extends JpaRepository<Incarico, Long> {

    Optional<Incarico> findByRichiestaId(Long richiestaId);

    List<Incarico> findByRichiestaClienteId(Long clienteId);

    List<Incarico> findByProfiloFornitoreUtenteId(Long utenteId);

    /** I prezzi a cui si sono davvero chiusi i lavori di una categoria. */
    List<Incarico> findByStatoAndRichiestaCategoriaId(StatoIncarico stato, Long categoriaId);

    /** Come sopra ma sul lavoro preciso: piu' attendibile, quando ce n'e' abbastanza. */
    List<Incarico> findByStatoAndRichiestaAttivitaId(StatoIncarico stato, Long attivitaId);
}
