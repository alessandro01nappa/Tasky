package it.tasky;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssenzaRepository extends JpaRepository<Assenza, Long> {

    List<Assenza> findByProfiloFornitoreIdOrderByDalAsc(Long profiloId);
}
