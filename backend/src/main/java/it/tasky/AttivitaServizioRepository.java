package it.tasky;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttivitaServizioRepository extends JpaRepository<AttivitaServizio, Long> {

    List<AttivitaServizio> findByCategoriaIdOrderByNome(Long categoriaId);

    boolean existsByNomeAndCategoriaId(String nome, Long categoriaId);
}
