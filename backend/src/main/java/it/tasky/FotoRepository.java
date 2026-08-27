package it.tasky;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FotoRepository extends JpaRepository<Foto, Long> {

    List<Foto> findByRichiestaIdOrderById(Long richiestaId);

    long countByRichiestaId(Long richiestaId);
}
