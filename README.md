# Les Petits Plats - Projet 7

Application front-end en JavaScript vanilla réalisée dans le cadre du projet **OpenClassrooms - Les Petits Plats**.

L'objectif du projet est de concevoir un moteur de recherche de recettes **fluide, rapide et maintenable**, puis de comparer **deux implémentations de l'algorithme principal** afin de recommander la plus pertinente.

## Objectifs du projet

- Intégrer l'interface à partir de la maquette fournie.
- Implémenter la recherche principale sur les recettes.
- Implémenter les filtres par tags :
  - ingrédients
  - appareils
  - ustensiles
- Comparer deux approches algorithmiques pour la recherche principale :
  - **approche fonctionnelle** (`filter`, `map`, `every`)
  - **approche par boucles natives** (`for`, conditions, `break`)
- Produire une **fiche d'investigation** avec benchmark et recommandation finale.

## Stack technique

- HTML5
- CSS3
- JavaScript vanilla
- Dataset local en JSON (`recipes.js`)
- Aucun framework JavaScript
- Aucun build tool

## Fonctionnalites principales

- Barre de recherche principale
- Recherche active a partir de **3 caracteres**
- Recherche multi-mots (ex. `poulet coco`)
- Normalisation du texte :
  - passage en minuscules
  - suppression des accents
  - nettoyage des caracteres speciaux
  - suppression des espaces en trop
- Filtres dynamiques par tags
- Mise a jour des listes de filtres en fonction des recettes affichees
- Affichage du nombre de recettes correspondantes
- Etat vide si aucune recette ne correspond a la recherche
- Debounce sur les champs de recherche pour limiter les recalculs inutiles

## Bonnes pratiques appliquees

- Decoupage du code en fonctions reutilisables
- Pre-calcul / cache des blobs de recherche pour limiter les traitements repetitifs
- Echapper le HTML avant injection dans le DOM pour limiter les risques d'injection
- Separation claire entre :
  - utilitaires
  - rendu
  - logique de recherche
  - gestion des filtres
  - initialisation

## Comparaison algorithmique

Deux implementations ont ete etudiees pour la **recherche principale uniquement**.

### 1) Approche fonctionnelle

Utilisation des methodes natives de tableau comme `filter`, `every` et `map`.

**Avantages :**

- code plus lisible
- plus simple a maintenir
- plus declaratif

### 2) Approche par boucles

Utilisation de boucles `for` et d'un `break` anticipe.

**Avantages :**

- leger gain en vitesse brute sur certains cas
- controle plus fin du parcours

### Conclusion retenue

Les benchmarks montrent des performances **tres proches** entre les deux solutions.

L'approche **fonctionnelle** est recommandee pour ce projet car elle offre le meilleur equilibre entre :

- lisibilite
- maintenabilite
- evolutivite

L'approche par boucles reste pertinente si le dataset grossit fortement et qu'une optimisation micro-performante devient prioritaire.

## Resultats benchmark (resume)

Tests realises sur **jsben.ch** avec un dataset etendu a **500 recettes**.

- Requetes courtes : performances quasi equivalentes
- Requetes longues : boucles legerement devant
- Deux mots-cles : fonctionnelle legerement devant
- Trois mots-cles et plus : boucles legerement devant
- Aucun resultat : egalite

## Arborescence du projet

```text
.
├── public/
│   └── index.html
├── src/
│   ├── app.js
│   ├── data/
│   │   └── recipes.js
│   └── styles/
│       └── main.css
├── README.md
├── Fiche_investigation_finale.pdf
├── Fiche_investigation_resume.pdf
└── benchmark_resultats.pdf
```

## Lancer le projet

Le projet est **100% statique**. Il n'y a pas de `npm install` ni de build a executer.

### Option 1 - VS Code + Live Server

1. Ouvrir le dossier du projet dans VS Code
2. Ouvrir `public/index.html`
3. Lancer **Open with Live Server**

### Option 2 - Serveur local Python

Depuis la racine du projet :

```bash
python -m http.server 5500
```

Puis ouvrir dans le navigateur :

```text
http://localhost:5500/public/index.html
```

## Documents fournis

- **Fiche_investigation_finale.pdf** : document principal de comparaison des deux algorithmes
- **Fiche_investigation_resume.pdf** : version resumee
- **benchmark_resultats.pdf** : synthese des mesures de performance

## Note importante sur les images

Dans certaines archives partagees, le dossier des images peut etre retire pour alleger le poids du projet.

Dans ce cas :

- l'application se lance correctement
- les fonctionnalites JavaScript restent testables
- les visuels des cartes et de la hero section ne s'affichent pas tant que les images ne sont pas replacees dans `public/assets/images`

## Auteur

Projet realise par **Yazan** dans le cadre de la formation OpenClassrooms.
