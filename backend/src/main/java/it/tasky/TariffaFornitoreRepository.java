package it.tasky;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TariffaFornitoreRepository extends JpaRepository<TariffaFornitore, Long> {

    List<TariffaFornitore> findByProfiloFornitoreId(Long profiloFornitoreId);

    List<TariffaFornitore> findByCategoriaIdAndProfiloFornitoreStato(
            Long categoriaId, StatoFornitore stato);

    void deleteByProfiloFornitoreId(Long profiloFornitoreId);
}
