# JobCoach AI

Assistant pour les chercheurs d'emploi : rédaction de CV, relecture, lettre de motivation, préparation d'entretien et simulateur de recruteur. L'intelligence artificielle tourne côté serveur via l'API Gemini (modèle Gemma 4). Rien n'est sauvegardé.

## Prérequis

- Node.js 20 ou plus récent
- npm
- Une clé API Google AI Studio

## Installation en local

```bash
npm install
```

Créez une clé sur [Google AI Studio](https://aistudio.google.com/apikey), puis dupliquez le fichier d'exemple :

```bash
cp .env.local.example .env.local
```

Sous Windows PowerShell :

```powershell
Copy-Item .env.local.example .env.local
```

Ouvrez `.env.local` et renseignez :

```
GEMINI_API_KEY=votre_cle_ici
GEMINI_MODEL=gemma-4-31b-it
```

`GEMINI_MODEL` est optionnel : s'il est absent, l'application utilise `gemma-4-31b-it`.

Lancez le serveur de développement :

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## Déploiement sur Vercel

1. Importez le dépôt dans [Vercel](https://vercel.com/new).
2. Dans **Settings → Environment Variables**, ajoutez :
   - `GEMINI_API_KEY` : votre clé Google AI Studio
   - `GEMINI_MODEL` : `gemma-4-31b-it` (recommandé)
3. Déployez.

Ne placez jamais la clé dans le code client ni dans un fichier commité.

## Limites

- Aucune base de données, aucune authentification, aucune sauvegarde : tout disparaît au rechargement de la page.
- Le CV et l'offre se collent en texte, pas en PDF.
- Les appels à l'IA passent par `POST /api/coach`. Le niveau gratuit de l'API Gemini est soumis à des quotas (erreur 429 en cas de dépassement).
