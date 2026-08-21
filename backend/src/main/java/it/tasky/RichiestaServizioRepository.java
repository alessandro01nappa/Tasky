package it.tasky;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RichiestaServizioRepository extends JpaRepository<RichiestaServizio, Long> {

    List<RichiestaServizio> findByStato(StatoRichiesta stato);

    List<RichiestaServizio> findByStatoAndFornitoreRichiestoIsNull(StatoRichiesta stato);

    List<RichiestaServizio> findByFornitoreRichiestoIdAndStato(Long fornitoreId, StatoRichiesta stato);

    List<RichiestaServizio> findByClienteId(Long clienteId);
}
