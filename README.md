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
├── frontend/            React 
├── docs/                diagrammi
└── docker-compose.yml   PostgreSQL
```
