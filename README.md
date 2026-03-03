# Les Petits Plats — Projet 7

Application en JavaScript (sans librairie JS) qui permet de chercher des recettes via :

- une barre de recherche principale
- des filtres par tags (ingrédients, appareils, ustensiles)

## Fonctionnalités

- Recherche principale (active à partir de 3 caractères)
- Normalisation du texte : minuscules, suppression des accents, nettoyage
- Recherche multi-mots (ex: `poulet coco`)
- Mise à jour rapide (debounce) pour éviter trop de calculs à chaque frappe
- Tags dynamiques basés sur les recettes affichées
- Sécurité : échappement HTML avant d’injecter du contenu dans le DOM

## Structure

- `public/index.html` : page principale
- `src/app.js` : logique JS (recherche, filtres, rendu)
- `src/data/recipes.js` : données des recettes
- `src/styles/main.css` : styles

## Lancer le projet

### Option 1 : Live Server (VS Code)

1. Ouvrir le dossier du projet dans VS Code
2. Clic droit sur `public/index.html`
3. **Open with Live Server**

### Option 2 : Serveur local (Python)

Depuis la racine du projet :

```bash
python -m http.server 5500
```
