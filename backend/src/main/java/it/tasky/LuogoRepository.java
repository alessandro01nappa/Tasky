package it.tasky;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LuogoRepository extends JpaRepository<Luogo, Long> {

    Optional<Luogo> findByCercato(String cercato);
}
