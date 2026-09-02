package it.tasky;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import jakarta.servlet.DispatcherType;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.List;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SicurezzaConfig {

    private final SecretKey chiave;
    private final String frontendUrl;

    private static final Logger log = LoggerFactory.getLogger(SicurezzaConfig.class);

    /** Sotto i 32 byte la firma HMAC-SHA256 non regge: meglio rifiutarsi di partire. */
    private static final int BYTE_MINIMI = 32;

    public SicurezzaConfig(
            @Value("${tasky.jwt.segreto:}") String segreto,
            @Value("${tasky.frontend.url}") String frontendUrl) {
        this.chiave = new SecretKeySpec(chiaveDa(segreto), "HmacSHA256");
        this.frontendUrl = frontendUrl;
    }

    /**
     * Il segreto arriva dall'ambiente e non sta nel codice. Se manca se ne genera
     * uno a caso: l'app parte lo stesso, ma le sessioni non sopravvivono a un
     * riavvio, ed e' un prezzo giusto per non avere una chiave pubblica.
     */
    private static byte[] chiaveDa(String segreto) {
        if (segreto == null || segreto.isBlank()) {
            log.warn("TASKY_JWT_SEGRETO non impostata: ne uso una casuale."
                    + " Chi ha fatto l'accesso dovra' rifarlo a ogni riavvio.");
            byte[] casuale = new byte[BYTE_MINIMI];
            new SecureRandom().nextBytes(casuale);
            return casuale;
        }
        byte[] byteSegreto = segreto.getBytes(StandardCharsets.UTF_8);
        if (byteSegreto.length < BYTE_MINIMI) {
            throw new IllegalStateException(
                    "TASKY_JWT_SEGRETO troppo corta: servono almeno " + BYTE_MINIMI + " caratteri");
        }
        return byteSegreto;
    }

    @Bean
    SecurityFilterChain sicurezza(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sessioni -> sessioni.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(richieste -> richieste
                        // senza questa riga gli errori, che passano da /error, diventerebbero 401
                        .dispatcherTypeMatchers(DispatcherType.ERROR)
                        .permitAll()
                        .requestMatchers("/api/registrazione", "/api/login")
                        .permitAll()
                        .requestMatchers("/api/health")
                        .permitAll()
                        .anyRequest()
                        .authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configurazione = new CorsConfiguration();
        configurazione.setAllowedOrigins(List.of(frontendUrl));
        configurazione.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configurazione.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        UrlBasedCorsConfigurationSource fonte = new UrlBasedCorsConfigurationSource();
        fonte.registerCorsConfiguration("/api/**", configurazione);
        return fonte;
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    JwtEncoder jwtEncoder() {
        return new NimbusJwtEncoder(new ImmutableSecret<>(chiave));
    }

    @Bean
    JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder.withSecretKey(chiave).build();
    }
}
