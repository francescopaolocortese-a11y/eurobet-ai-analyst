# ⚽ EuroBet AI Analyst

L'applicazione definitiva per l'analisi calcistica supportata dall'Intelligenza Artificiale.
Combina la potenza di **Google Gemini 2.5** con i dati statistici in tempo reale (Live Score, xG, Statistiche) forniti da **Sportmonks** e **API-Football**.

![App Preview](https://ui-avatars.com/api/?name=EB&background=10b981&color=fff&size=128&rounded=true&bold=true)

## 🚀 Funzionalità Principali

- **🤖 Analisi AI Avanzata**: Utilizza Gemini 2.5 con Search Grounding per pronostici basati su dati tattici e news recenti.
- **📊 Dati Live & xG**: Integrazione profonda con Sportmonks v3 per mostrare Gol Attesi (xG), possesso palla e tiri in tempo reale.
- **🔥 Algoritmo "Top Picks"**: Identifica automaticamente le migliori opportunità giornaliere (es. Top Over 1.5).
- **📱 PWA (Progressive Web App)**: Installabile come app nativa su iOS e Android.
- **💰 Gestione Bankroll**: Tracciamento automatico delle giocate, ROI e Profitto Netto.
- **🌍 Copertura Globale**: Supporto per tutti i campionati europei e competizioni internazionali.

## 🛠 Tecnologie

- **Frontend**: React 18, Vite, TypeScript
- **UI**: Tailwind CSS, Lucide Icons
- **AI**: Google GenAI SDK (Gemini 2.5 Flash)
- **Dati**: Sportmonks API v3 / API-Football (Fallback)
- **Deployment**: Vercel

## 📦 Installazione Locale

1. Clona il repository:
   ```bash
   git clone https://github.com/francescopaolocortese-a11y/eurobet-ai.git
   ```
2. Entra nella cartella:
   ```bash
   cd eurobet-ai
   ```
3. Installa le dipendenze:
   ```bash
   npm install
   ```
4. Crea un file `.env` nella root e aggiungi la tua chiave Gemini (opzionale se usi quella integrata):
   ```env
   API_KEY=la_tua_chiave_gemini
   ```
5. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```

## 🚀 Deploy su Vercel

Il progetto è configurato per il deploy automatico su Vercel.

1. Fai il push del codice su GitHub.
2. Importa il progetto su Vercel.
3. Aggiungi la variabile d'ambiente `API_KEY` nelle impostazioni del progetto su Vercel.
4. Clicca su **Deploy**.

---
*Sviluppato con ❤️ per gli appassionati di calcio.*