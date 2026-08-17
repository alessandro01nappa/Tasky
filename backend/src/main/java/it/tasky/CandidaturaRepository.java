package it.tasky;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CandidaturaRepository extends JpaRepository<Candidatura, Long> {

    List<Candidatura> findByRichiestaId(Long richiestaId);

    boolean existsByRichiestaIdAndProfiloFornitoreId(Long richiestaId, Long profiloFornitoreId);
}
