package it.tasky;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DisponibilitaRepository extends JpaRepository<FasciaDisponibilita, Long> {

    List<FasciaDisponibilita> findByProfiloFornitoreIdOrderByGiornoAscDalleAsc(Long profiloId);

    void deleteByProfiloFornitoreId(Long profiloId);
}
