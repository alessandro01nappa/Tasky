INSERT INTO categorie_servizio (nome) VALUES ('Commissioni')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO attivita_servizio (id, nome, categoria_id) VALUES
    (201, 'Montaggio mobili', 3),
    (202, 'Piccole riparazioni domestiche', 5),
    (203, 'Pulizia appartamento', 1),
    (204, 'Pulizia vetrate', 1),
    (205, 'Cura del giardino', 2),
    (206, 'Potatura siepi', 2),
    (207, 'Aiuto trasloco', 4),
    (208, 'Consegna con furgone', 4),
    (209, 'Configurazione computer', 11),
    (210, 'Lezioni smartphone', 11),
    (211, 'Passeggiata con il cane', 12),
    (212, 'Spesa e commissioni', (SELECT id FROM categorie_servizio WHERE nome = 'Commissioni'))
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, categoria_id = EXCLUDED.categoria_id;

INSERT INTO utenti (id, email, hash_password, nome_completo, telefono, citta, data_creazione, sospeso) VALUES
    (1001, 'marco.riva.demo@tasky.test', '$2a$10$wVdTkYnDKwSW65HVc55gs.d7H/jraUA6Va1nhULAU5DBuXq81rq5O', 'Marco Riva', '+39 320 555 0101', 'Milano', '2026-01-12 09:15:00', false),
    (1002, 'giulia.ferro.demo@tasky.test', '$2a$10$wVdTkYnDKwSW65HVc55gs.d7H/jraUA6Va1nhULAU5DBuXq81rq5O', 'Giulia Ferro', '+39 320 555 0102', 'Torino', '2026-01-18 11:20:00', false),
    (1003, 'luca.conti.demo@tasky.test', '$2a$10$wVdTkYnDKwSW65HVc55gs.d7H/jraUA6Va1nhULAU5DBuXq81rq5O', 'Luca Conti', '+39 320 555 0103', 'Bologna', '2026-02-04 15:40:00', false),
    (1004, 'sara.mancini.demo@tasky.test', '$2a$10$wVdTkYnDKwSW65HVc55gs.d7H/jraUA6Va1nhULAU5DBuXq81rq5O', 'Sara Mancini', '+39 320 555 0104', 'Roma', '2026-02-09 08:50:00', false),
    (1005, 'davide.greco.demo@tasky.test', '$2a$10$wVdTkYnDKwSW65HVc55gs.d7H/jraUA6Va1nhULAU5DBuXq81rq5O', 'Davide Greco', '+39 320 555 0105', 'Napoli', '2026-02-15 13:10:00', false),
    (1006, 'elena.romano.demo@tasky.test', '$2a$10$wVdTkYnDKwSW65HVc55gs.d7H/jraUA6Va1nhULAU5DBuXq81rq5O', 'Elena Romano', '+39 320 555 0106', 'Palermo', '2026-02-21 10:05:00', false),
    (1007, 'anna.bassi.demo@tasky.test', '$2a$10$wVdTkYnDKwSW65HVc55gs.d7H/jraUA6Va1nhULAU5DBuXq81rq5O', 'Anna Bassi', '+39 320 555 0107', 'Milano', '2026-03-01 09:30:00', false),
    (1008, 'pietro.moro.demo@tasky.test', '$2a$10$wVdTkYnDKwSW65HVc55gs.d7H/jraUA6Va1nhULAU5DBuXq81rq5O', 'Pietro Moro', '+39 320 555 0108', 'Firenze', '2026-03-03 16:25:00', false),
    (1009, 'chiara.serra.demo@tasky.test', '$2a$10$wVdTkYnDKwSW65HVc55gs.d7H/jraUA6Va1nhULAU5DBuXq81rq5O', 'Chiara Serra', '+39 320 555 0109', 'Cagliari', '2026-03-07 12:00:00', false),
    (1010, 'tommaso.lodi.demo@tasky.test', '$2a$10$wVdTkYnDKwSW65HVc55gs.d7H/jraUA6Va1nhULAU5DBuXq81rq5O', 'Tommaso Lodi', '+39 320 555 0110', 'Verona', '2026-03-10 18:15:00', false)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, hash_password = EXCLUDED.hash_password, nome_completo = EXCLUDED.nome_completo, telefono = EXCLUDED.telefono, citta = EXCLUDED.citta, sospeso = EXCLUDED.sospeso;

INSERT INTO profili_fornitore (id, utente_id, descrizione, zona_operativa, latitudine, longitudine, stato, tipo, termini_accettati, data_creazione, data_approvazione) VALUES
    (2001, 1001, 'Mi piace montare mobili e sistemare le piccole cose di casa. Lavoro con calma e porto i miei attrezzi.', 'Milano e hinterland', 45.4642, 9.1900, 'APPROVATO', 'HOBBISTA', true, '2026-01-12 09:20:00', '2026-01-13 10:00:00'),
    (2002, 1002, 'Pulizie precise e ordinate, anche dopo piccoli lavori o traslochi.', 'Torino e prima cintura', 45.0703, 7.6869, 'APPROVATO', 'PROFESSIONISTA', true, '2026-01-18 11:30:00', '2026-01-19 09:10:00'),
    (2003, 1003, 'Mi occupo di giardini nel tempo libero e mi diverto a rimettere in ordine gli spazi verdi.', 'Bologna e provincia', 44.4949, 11.3426, 'APPROVATO', 'HOBBISTA', true, '2026-02-04 15:45:00', '2026-02-05 14:00:00'),
    (2004, 1004, 'Aiuto con traslochi, consegne e montaggi. Ho un furgone compatto e tanta pazienza.', 'Roma e comuni limitrofi', 41.9028, 12.4964, 'APPROVATO', 'PROFESSIONISTA', true, '2026-02-09 09:00:00', '2026-02-10 11:30:00'),
    (2005, 1005, 'Sono pratico di computer e smartphone. Mi piace spiegare le cose in modo semplice.', 'Napoli e provincia', 40.8518, 14.2681, 'APPROVATO', 'HOBBISTA', true, '2026-02-15 13:20:00', '2026-02-16 10:20:00'),
    (2006, 1006, 'Mi prendo cura di animali e commissioni quando qualcuno ha bisogno di una mano.', 'Palermo e dintorni', 38.1157, 13.3615, 'APPROVATO', 'PROFESSIONISTA', true, '2026-02-21 10:15:00', '2026-02-22 12:00:00')
ON CONFLICT (id) DO UPDATE SET utente_id = EXCLUDED.utente_id, descrizione = EXCLUDED.descrizione, zona_operativa = EXCLUDED.zona_operativa, latitudine = EXCLUDED.latitudine, longitudine = EXCLUDED.longitudine, stato = EXCLUDED.stato, tipo = EXCLUDED.tipo, termini_accettati = EXCLUDED.termini_accettati, data_approvazione = EXCLUDED.data_approvazione;

INSERT INTO categorie_fornitore (profilo_fornitore_id, categoria_servizio_id) VALUES
    (2001, 3), (2001, 4), (2002, 1), (2003, 2), (2004, 3), (2004, 4),
    (2005, 11), (2005, 5), (2006, 12), (2006, 1)
ON CONFLICT DO NOTHING;

INSERT INTO attivita_fornitore (profilo_fornitore_id, attivita_servizio_id) VALUES
    (2001, 201), (2001, 202), (2001, 207), (2002, 203), (2002, 204), (2003, 205),
    (2003, 206), (2004, 201), (2004, 207), (2004, 208), (2005, 209), (2005, 210),
    (2006, 211), (2006, 212)
ON CONFLICT DO NOTHING;

INSERT INTO tariffe_fornitore (id, tariffa_oraria, categoria_id, profilo_fornitore_id) VALUES
    (7001, 28.00, 3, 2001), (7002, 24.00, 4, 2001), (7003, 30.00, 1, 2002),
    (7004, 22.00, 2, 2003), (7005, 35.00, 3, 2004), (7006, 42.00, 4, 2004),
    (7007, 26.00, 11, 2005), (7008, 24.00, 5, 2005), (7009, 18.00, 12, 2006),
    (7010, 20.00, 1, 2006)
ON CONFLICT (id) DO UPDATE SET tariffa_oraria = EXCLUDED.tariffa_oraria, categoria_id = EXCLUDED.categoria_id, profilo_fornitore_id = EXCLUDED.profilo_fornitore_id;

INSERT INTO luoghi (id, cercato, indirizzo, citta, latitudine, longitudine, data_creazione) VALUES
    (3001, 'via tortona 31 milano', 'Via Tortona 31, 20144 Milano MI', 'Milano', 45.4516, 9.1613, '2026-03-01 10:00:00'),
    (3002, 'corso francia 22 torino', 'Corso Francia 22, 10143 Torino TO', 'Torino', 45.0777, 7.6466, '2026-03-01 10:05:00'),
    (3003, 'via saragozza 78 bologna', 'Via Saragozza 78, 40135 Bologna BO', 'Bologna', 44.4888, 11.3248, '2026-03-01 10:10:00'),
    (3004, 'via appia nuova 180 roma', 'Via Appia Nuova 180, 00183 Roma RM', 'Roma', 41.8835, 12.5135, '2026-03-01 10:15:00'),
    (3005, 'via chiaia 120 napoli', 'Via Chiaia 120, 80121 Napoli NA', 'Napoli', 40.8352, 14.2461, '2026-03-01 10:20:00'),
    (3006, 'via libertà 95 palermo', 'Via della Libertà 95, 90144 Palermo PA', 'Palermo', 38.1330, 13.3448, '2026-03-01 10:25:00'),
    (3007, 'via gioberti 40 firenze', 'Via Gioberti 40, 50121 Firenze FI', 'Firenze', 43.7737, 11.2788, '2026-03-01 10:30:00'),
    (3008, 'via garibaldi 18 verona', 'Via Garibaldi 18, 37121 Verona VR', 'Verona', 45.4420, 10.9928, '2026-03-01 10:35:00'),
    (3009, 'via roma 55 cagliari', 'Via Roma 55, 09124 Cagliari CA', 'Cagliari', 39.2130, 9.1116, '2026-03-01 10:40:00')
ON CONFLICT (id) DO UPDATE SET cercato = EXCLUDED.cercato, indirizzo = EXCLUDED.indirizzo, citta = EXCLUDED.citta, latitudine = EXCLUDED.latitudine, longitudine = EXCLUDED.longitudine;

INSERT INTO richieste_servizio (id, cliente_id, categoria_id, attivita_id, titolo, descrizione, citta, indirizzo, latitudine, longitudine, budget, data_preferita, data_entro, stato, data_creazione) VALUES
    (4001, 1007, 3, 201, 'Montare libreria in soggiorno', 'Cerco una persona precisa per montare una libreria a parete e fissarla in sicurezza.', 'Milano', 'Via Tortona 31, Milano', 45.4516, 9.1613, 75.00, '2026-09-05', '2026-09-10', 'APERTA', '2026-08-28 09:00:00'),
    (4002, 1008, 2, 205, 'Sistemare il giardino prima dell autunno', 'Tagliare il prato, raccogliere le foglie e sistemare due aiuole.', 'Firenze', 'Via Gioberti 40, Firenze', 43.7737, 11.2788, 110.00, '2026-09-06', '2026-09-12', 'APERTA', '2026-08-29 10:30:00'),
    (4003, 1009, 12, 211, 'Passeggiata per il mio cagnolino', 'Una passeggiata di circa un ora nel pomeriggio per il mio meticcio Milo.', 'Cagliari', 'Via Roma 55, Cagliari', 39.2130, 9.1116, 25.00, '2026-09-04', '2026-09-04', 'APERTA', '2026-08-30 12:00:00'),
    (4004, 1010, 11, 209, 'Configurare il nuovo computer', 'Installazione iniziale, stampante e trasferimento dei documenti dal vecchio computer.', 'Verona', 'Via Garibaldi 18, Verona', 45.4420, 10.9928, 60.00, '2026-09-07', '2026-09-14', 'APERTA', '2026-08-30 15:20:00'),
    (4005, 1007, 1, 203, 'Pulizia profonda dopo imbiancatura', 'Pulizia di un bilocale vuoto dopo una tinteggiatura.', 'Milano', 'Via Tortona 31, Milano', 45.4516, 9.1613, 140.00, '2026-08-25', '2026-08-28', 'COMPLETATA', '2026-08-18 08:30:00'),
    (4006, 1008, 4, 207, 'Una mano con il trasloco', 'Servono due persone per scatoloni e mobili dal terzo piano.', 'Bologna', 'Via Saragozza 78, Bologna', 44.4888, 11.3248, 180.00, '2026-08-22', '2026-08-24', 'COMPLETATA', '2026-08-12 14:00:00'),
    (4007, 1009, 5, 202, 'Cambiare un rubinetto in cucina', 'Il rubinetto perde e vorrei sostituirlo con quello già acquistato.', 'Napoli', 'Via Chiaia 120, Napoli', 40.8352, 14.2461, 55.00, '2026-09-02', '2026-09-03', 'ASSEGNATA', '2026-08-27 17:45:00'),
    (4008, 1010, 1, 204, 'Pulire le vetrate del negozio', 'Pulizia interna ed esterna di quattro vetrate al piano strada.', 'Torino', 'Corso Francia 22, Torino', 45.0777, 7.6466, 95.00, '2026-09-03', '2026-09-05', 'ASSEGNATA', '2026-08-28 11:15:00'),
    (4009, 1007, 4, 208, 'Portare un divano in deposito', 'Serve un furgone per portare un divano da Milano a Monza.', 'Milano', 'Via Tortona 31, Milano', 45.4516, 9.1613, 120.00, '2026-09-01', '2026-09-02', 'ANNULLATA', '2026-08-20 16:10:00'),
    (4010, 1008, 11, 210, 'Imparare a usare lo smartphone', 'Vorrei imparare a usare videochiamate, foto e messaggi vocali.', 'Roma', 'Via Appia Nuova 180, Roma', 41.8835, 12.5135, 40.00, '2026-08-20', '2026-08-22', 'COMPLETATA', '2026-08-10 09:40:00'),
    (4011, 1009, (SELECT id FROM categorie_servizio WHERE nome = 'Commissioni'), 212, 'Ritirare la spesa al mercato', 'Ritiro della spesa già pagata e consegna a casa nel quartiere.', 'Palermo', 'Via della Libertà 95, Palermo', 38.1330, 13.3448, 22.00, '2026-09-08', '2026-09-08', 'APERTA', '2026-08-31 08:20:00'),
    (4012, 1010, 2, 206, 'Potare la siepe del cortile', 'Potatura di una siepe di circa dodici metri e raccolta degli scarti.', 'Napoli', 'Via Chiaia 120, Napoli', 40.8352, 14.2461, 90.00, '2026-09-09', '2026-09-15', 'APERTA', '2026-08-31 13:50:00')
ON CONFLICT (id) DO UPDATE SET cliente_id = EXCLUDED.cliente_id, categoria_id = EXCLUDED.categoria_id, attivita_id = EXCLUDED.attivita_id, titolo = EXCLUDED.titolo, descrizione = EXCLUDED.descrizione, citta = EXCLUDED.citta, indirizzo = EXCLUDED.indirizzo, latitudine = EXCLUDED.latitudine, longitudine = EXCLUDED.longitudine, budget = EXCLUDED.budget, data_preferita = EXCLUDED.data_preferita, data_entro = EXCLUDED.data_entro, stato = EXCLUDED.stato, data_creazione = EXCLUDED.data_creazione;

INSERT INTO candidature (id, data_creazione, messaggio, prezzo_offerto, stato, profilo_fornitore_id, richiesta_id) VALUES
    (5001, '2026-08-28 10:00:00', 'Posso occuparmene sabato mattina, porto già tutto il necessario.', 70.00, 'IN_ATTESA', 2001, 4001),
    (5002, '2026-08-29 12:10:00', 'Lavoro pulito e veloce, posso venire con la mia attrezzatura.', 105.00, 'IN_ATTESA', 2003, 4002),
    (5003, '2026-08-30 13:20:00', 'Conosco bene la zona e sono disponibile per la passeggiata indicata.', 25.00, 'IN_ATTESA', 2006, 4003),
    (5004, '2026-08-30 16:00:00', 'Ti aiuto volentieri con configurazione e trasferimento dati.', 55.00, 'IN_ATTESA', 2005, 4004),
    (5005, '2026-08-19 09:10:00', 'Intervento completato con soddisfazione del cliente.', 130.00, 'ACCETTATA', 2002, 4005),
    (5006, '2026-08-13 15:00:00', 'Abbiamo furgone e cinghie per lavorare in sicurezza.', 170.00, 'ACCETTATA', 2004, 4006),
    (5007, '2026-08-28 09:30:00', 'Posso sostituire il rubinetto e controllare anche i raccordi.', 50.00, 'ACCETTATA', 2001, 4007),
    (5008, '2026-08-29 08:30:00', 'Ho esperienza nella pulizia di vetrine e negozi.', 90.00, 'ACCETTATA', 2002, 4008),
    (5009, '2026-08-11 11:00:00', 'Le spiego tutto con calma e lascio una piccola guida scritta.', 35.00, 'ACCETTATA', 2005, 4010),
    (5010, '2026-08-21 14:30:00', 'Posso passare nel pomeriggio con il mio furgone.', 100.00, 'RIFIUTATA', 2004, 4009)
ON CONFLICT (id) DO UPDATE SET messaggio = EXCLUDED.messaggio, prezzo_offerto = EXCLUDED.prezzo_offerto, stato = EXCLUDED.stato, profilo_fornitore_id = EXCLUDED.profilo_fornitore_id, richiesta_id = EXCLUDED.richiesta_id;

INSERT INTO incarichi (id, richiesta_id, profilo_fornitore_id, prezzo_concordato, stato, data_creazione, data_completamento) VALUES
    (6001, 4005, 2002, 130.00, 'COMPLETATO', '2026-08-19 09:20:00', '2026-08-25 16:30:00'),
    (6002, 4006, 2004, 170.00, 'COMPLETATO', '2026-08-13 15:10:00', '2026-08-22 18:00:00'),
    (6003, 4007, 2001, 50.00, 'IN_CORSO', '2026-08-28 09:40:00', NULL),
    (6004, 4008, 2002, 90.00, 'ASSEGNATO', '2026-08-29 08:40:00', NULL),
    (6005, 4010, 2005, 35.00, 'COMPLETATO', '2026-08-11 11:10:00', '2026-08-20 17:00:00'),
    (6006, 4009, 2004, 100.00, 'ANNULLATO', '2026-08-21 14:40:00', NULL)
ON CONFLICT (id) DO UPDATE SET richiesta_id = EXCLUDED.richiesta_id, profilo_fornitore_id = EXCLUDED.profilo_fornitore_id, prezzo_concordato = EXCLUDED.prezzo_concordato, stato = EXCLUDED.stato, data_creazione = EXCLUDED.data_creazione, data_completamento = EXCLUDED.data_completamento;

INSERT INTO recensioni (id, incarico_id, voto, commento, data_creazione) VALUES
    (8001, 6001, 5, 'Molto preciso, puntuale e gentile. Casa lasciata davvero bene.', '2026-08-25 18:00:00'),
    (8002, 6002, 5, 'Ci ha dato una grande mano con il trasloco, tutto organizzato benissimo.', '2026-08-23 09:15:00'),
    (8003, 6005, 4, 'Spiegazione chiara e tanta pazienza. Ora uso il telefono con più sicurezza.', '2026-08-20 19:00:00')
ON CONFLICT (id) DO UPDATE SET incarico_id = EXCLUDED.incarico_id, voto = EXCLUDED.voto, commento = EXCLUDED.commento, data_creazione = EXCLUDED.data_creazione;

INSERT INTO fasce_disponibilita (id, profilo_fornitore_id, giorno, dalle, alle) VALUES
    (11001, 2001, 'SATURDAY', '09:00', '13:00'), (11002, 2001, 'WEDNESDAY', '18:00', '20:00'),
    (11003, 2002, 'MONDAY', '09:00', '17:00'), (11004, 2002, 'FRIDAY', '09:00', '17:00'),
    (11005, 2003, 'TUESDAY', '14:00', '19:00'), (11006, 2003, 'SATURDAY', '09:00', '14:00'),
    (11007, 2004, 'THURSDAY', '08:00', '18:00'), (11008, 2004, 'SATURDAY', '08:00', '13:00'),
    (11009, 2005, 'WEDNESDAY', '17:00', '20:00'), (11010, 2005, 'SUNDAY', '10:00', '13:00'),
    (11011, 2006, 'MONDAY', '08:00', '12:00'), (11012, 2006, 'FRIDAY', '15:00', '19:00')
ON CONFLICT (id) DO UPDATE SET profilo_fornitore_id = EXCLUDED.profilo_fornitore_id, giorno = EXCLUDED.giorno, dalle = EXCLUDED.dalle, alle = EXCLUDED.alle;

INSERT INTO assenze (id, profilo_fornitore_id, dal, al, motivo) VALUES
    (12001, 2002, '2026-09-12', '2026-09-14', 'Weekend fuori città'),
    (12002, 2004, '2026-09-20', '2026-09-22', 'Impegno personale'),
    (12003, 2006, '2026-09-05', '2026-09-06', 'Famiglia')
ON CONFLICT (id) DO UPDATE SET profilo_fornitore_id = EXCLUDED.profilo_fornitore_id, dal = EXCLUDED.dal, al = EXCLUDED.al, motivo = EXCLUDED.motivo;

INSERT INTO conversazioni (id, incarico_id, data_creazione) VALUES
    (9001, 6001, '2026-08-19 09:25:00'), (9002, 6002, '2026-08-13 15:15:00'),
    (9003, 6003, '2026-08-28 09:45:00'), (9004, 6004, '2026-08-29 08:45:00'),
    (9005, 6005, '2026-08-11 11:15:00')
ON CONFLICT (id) DO UPDATE SET incarico_id = EXCLUDED.incarico_id, data_creazione = EXCLUDED.data_creazione;

INSERT INTO messaggi (id, conversazione_id, autore_id, testo, data_creazione) VALUES
    (10001, 9001, 1007, 'Ciao Marco, grazie per aver accettato. La libreria è già in casa.', '2026-08-19 09:30:00'),
    (10002, 9001, 1002, 'Perfetto, porto io il trapano e arrivo puntuale.', '2026-08-19 09:35:00'),
    (10003, 9002, 1008, 'Per il trasloco ci vediamo alle otto davanti al portone.', '2026-08-13 15:20:00'),
    (10004, 9002, 1004, 'Va bene, saremo in due e porteremo le cinghie.', '2026-08-13 15:28:00'),
    (10005, 9003, 1009, 'Milo è tranquillo, ma ha bisogno del suo guinzaglio rosso.', '2026-08-28 10:00:00'),
    (10006, 9003, 1001, 'Perfetto, ricevuto. Ti mando un messaggio quando partiamo.', '2026-08-28 10:08:00'),
    (10007, 9004, 1010, 'Le vetrate sono accessibili anche dal marciapiede?', '2026-08-29 09:00:00'),
    (10008, 9004, 1002, 'Sì, ho visto la foto del negozio. Ci organizziamo senza problemi.', '2026-08-29 09:12:00'),
    (10009, 9005, 1008, 'Grazie Sara, ora riesco finalmente a fare le videochiamate.', '2026-08-20 17:10:00'),
    (10010, 9005, 1005, 'È stato un piacere, se hai dubbi scrivimi pure.', '2026-08-20 17:15:00')
ON CONFLICT (id) DO UPDATE SET conversazione_id = EXCLUDED.conversazione_id, autore_id = EXCLUDED.autore_id, testo = EXCLUDED.testo, data_creazione = EXCLUDED.data_creazione;

SELECT setval('categorie_servizio_id_seq', GREATEST((SELECT MAX(id) FROM categorie_servizio), 1), true);
SELECT setval('attivita_servizio_id_seq', GREATEST((SELECT MAX(id) FROM attivita_servizio), 1), true);
SELECT setval('utenti_id_seq', GREATEST((SELECT MAX(id) FROM utenti), 1), true);
SELECT setval('profili_fornitore_id_seq', GREATEST((SELECT MAX(id) FROM profili_fornitore), 1), true);
SELECT setval('luoghi_id_seq', GREATEST((SELECT MAX(id) FROM luoghi), 1), true);
SELECT setval('richieste_servizio_id_seq', GREATEST((SELECT MAX(id) FROM richieste_servizio), 1), true);
SELECT setval('candidature_id_seq', GREATEST((SELECT MAX(id) FROM candidature), 1), true);
SELECT setval('incarichi_id_seq', GREATEST((SELECT MAX(id) FROM incarichi), 1), true);
SELECT setval('recensioni_id_seq', GREATEST((SELECT MAX(id) FROM recensioni), 1), true);
SELECT setval('tariffe_fornitore_id_seq', GREATEST((SELECT MAX(id) FROM tariffe_fornitore), 1), true);
SELECT setval('fasce_disponibilita_id_seq', GREATEST((SELECT MAX(id) FROM fasce_disponibilita), 1), true);
SELECT setval('assenze_id_seq', GREATEST((SELECT MAX(id) FROM assenze), 1), true);
SELECT setval('conversazioni_id_seq', GREATEST((SELECT MAX(id) FROM conversazioni), 1), true);
SELECT setval('messaggi_id_seq', GREATEST((SELECT MAX(id) FROM messaggi), 1), true);
