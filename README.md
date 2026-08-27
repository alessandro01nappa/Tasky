# Tasky

Web app mobile first per mettere in contatto chi cerca piccoli servizi pratici con chi vuole offrirli:
lavori domestici, riparazioni, giardinaggio, montaggi, pulizie, traslochi e sgomberi.

Esiste un solo tipo di account. Lo stesso utente agisce da cliente quando pubblica una richiesta,
e da fornitore quando si candida — ma solo dopo aver completato la verifica.

## Stack

| Parte | Tecnologie |
|---|---|
| Frontend | React, React Router, Tailwind CSS, Vite |
| Backend | Java 25, Spring Boot, Spring Security + JWT, JPA/Hibernate |
| Database | PostgreSQL |
| Build | Maven (backend), npm (frontend) |

## Struttura

```
Tasky/
├── backend/             API REST in Spring Boot
├── frontend/            applicazione React (da creare)
├── docs/                diagrammi
└── docker-compose.yml   PostgreSQL per lo sviluppo
```

## Avvio

Il backend firma le sessioni con una chiave presa dall'ambiente. Senza, ne genera
una a caso a ogni avvio e chi ha fatto l'accesso deve rifarlo dopo ogni riavvio.

```
export TASKY_JWT_SEGRETO="una-frase-lunga-almeno-32-caratteri"
docker compose up -d
cd backend && mvn spring-boot:run
cd frontend && npm run dev
```

## Schema del database

Lo schema lo fanno le migrazioni in `backend/src/main/resources/db/migration`,
non Hibernate: all'avvio Flyway applica quelle che mancano e Hibernate si limita
a controllare che le tabelle corrispondano alle entità, fermandosi se non è così.

Per cambiare lo schema si aggiunge un file nuovo, `V2__cosa_cambia.sql`. I file
già applicati non si toccano più: Flyway se ne accorge e si rifiuta di partire.

## Modello dati

Otto tabelle. Diagramma completo su [drawSQL](https://drawsql.app/teams/alessandro-nappa/diagrams/tasky),
esportato anche in [docs/modello-dati.webp](docs/modello-dati.webp).

![Modello dati di Tasky](docs/modello-dati.webp)
