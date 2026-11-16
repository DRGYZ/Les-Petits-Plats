# Les Petits Plats — Projet 7

Application front-end réalisée en **JavaScript vanilla** dans le cadre du projet **OpenClassrooms — Les Petits Plats**, avec l’interface **Atelier Ardoise & Citron**.

[Voir la démo sur GitHub Pages](https://drgyz.github.io/Les-Petits-Plats/)

Le projet compare **deux implémentations de la même recherche** sur un jeu de 50 recettes. Dans la démo, le sélecteur **Moteur JS** permet de changer d’implémentation en conservant la requête et les filtres actifs.

---

# Objectifs du projet

- Intégrer une interface de recherche avec ingrédients du placard, filtres par tags et comparateur de recettes sur ordinateur et mobile
- Implémenter la **recherche principale** sur les recettes
- Implémenter des **filtres dynamiques par tags**
  - ingrédients
  - appareils
  - ustensiles

- Comparer **deux approches algorithmiques** pour la recherche principale (`searchFunctional` et `searchLoops`)
- Produire une **fiche d’investigation** avec benchmark et recommandation finale

---

# Stack technique

- HTML5
- CSS3 (interface adaptative sur ordinateur et mobile)
- JavaScript (vanilla)
- Jeu de 50 recettes dans un tableau JavaScript local (`src/data/recipes.js`)
- Images JPEG dans `public/assets/images`, avec chargement différé des images après les trois premières cartes
- Aucun framework JavaScript
- Aucun build tool

Le projet fonctionne **entièrement côté client**.

---

# Fonctionnalités principales

- Barre de recherche principale

- Recherche active à partir de **3 caractères**

- Recherche multi-mots (`poulet coco`). Chaque mot doit apparaître dans le texte indexé de la recette, qui regroupe le nom, la description, les ingrédients, l’appareil et les ustensiles.

- Normalisation du texte :
  - passage en minuscules
  - suppression des accents
  - suppression des caractères spéciaux
  - nettoyage des espaces

- Filtres dynamiques par tags :
  - ingrédients
  - appareils
  - ustensiles

- Mise à jour dynamique :
  - des recettes affichées
  - des listes de filtres

- Affichage du nombre de recettes correspondantes

- Affichage d’un **état vide** si aucune recette ne correspond

- Le raccourci **Voir aussi « coco »** conserve les filtres actifs et indique le nombre de recettes disponibles après élargissement. Dans l’état vide, **Toutes les recettes « coco »** efface les filtres pour afficher les résultats de cette recherche sur l’ensemble du jeu de données.

Un **debounce** est appliqué aux champs de recherche afin d’éviter des recalculs inutiles lors de la saisie utilisateur.

---

# Bonnes pratiques appliquées

- Découpage du code en **fonctions réutilisables**
- Pré-calcul et **cache des blobs de recherche** pour limiter les traitements répétés
- Échappement du HTML avant injection dans le DOM afin de limiter les risques d’injection
- Séparation claire entre :
  - utilitaires
  - rendu
  - logique de recherche
  - gestion des filtres
  - initialisation

---

# Comparaison algorithmique

Deux implémentations ont été développées pour la **recherche principale uniquement**.

## 1) Approche fonctionnelle

`searchFunctional` utilise `filter` et `every` pour exprimer directement la condition de recherche. C’est le moteur sélectionné au chargement.

---

## 2) Approche par boucles natives

`searchLoops` utilise des boucles `for` et un `break` dès qu’un mot ne correspond pas. Les deux moteurs parcourent les recettes dans l’ordre du jeu de données et utilisent le même texte normalisé et le même filtrage par tags.

---

# Vérifier les résultats et lire le temps de filtrage

Le test compare les identifiants ordonnés renvoyés par les deux moteurs sur les 50 recettes du dépôt. Il couvre les accents, les recherches multi-mots, les trois types de filtres, les recherches vides et les recherches sans résultat. Il vérifie aussi le compteur du raccourci « coco ».

```bash
node --test tests/search.test.mjs
```

Node.js 20 ou supérieur suffit pour lancer ce contrôle depuis la racine du dépôt, sans installation de dépendances.

L’indicateur **Filtrage** affiche la durée d’une seule exécution de la recherche et des filtres sélectionnés. L’index est préparé au chargement. Le calcul des options de filtres et des suggestions, le rendu des cartes et le délai de saisie sont hors mesure. Le navigateur, le cache et l’échauffement du moteur JavaScript peuvent faire varier la valeur affichée.

Le [résumé du benchmark de formation](benchmark_resultats.pdf) est conservé comme livrable historique. La démo affiche des mesures ponctuelles et le test ci-dessus vérifie l’équivalence des résultats.

---

# Arborescence du projet

```
.
├── index.html
├── public/
│   └── assets/
│       └── images/
├── src/
│   ├── app.js
│   ├── data/
│   │   └── recipes.js
│   └── styles/
│       └── main.css
├── tests/
│   └── search.test.mjs
├── README.md
├── Fiche_investigation_finale.pdf
├── Fiche_investigation_resume.pdf
└── benchmark_resultats.pdf
```

---

# Lancer le projet

Le projet est **100% statique**.
Il n'y a **aucune installation npm** ni build à exécuter.

## Option 1 — VS Code + Live Server

1. Ouvrir le dossier du projet dans **VS Code**
2. Ouvrir `index.html`
3. Lancer **Open with Live Server**

---

## Option 2 — Serveur local Python

Depuis la racine du projet :

```bash
python -m http.server 5500
```

Puis ouvrir dans le navigateur :

```
http://localhost:5500/index.html
```

---

# Documents fournis

- **Fiche_investigation_finale.pdf**
  Document principal de comparaison des deux algorithmes

- **Fiche_investigation_resume.pdf**
  Version synthétique de la fiche d’investigation

- **benchmark_resultats.pdf**
  Résumé des mesures de performance réalisées

---

# Note sur les images

Dans certaines archives partagées, le dossier des images peut être retiré afin d’alléger le poids du projet.

Dans ce cas :

- l'application se lance correctement
- les fonctionnalités JavaScript restent testables
- les visuels des cartes et de la section hero ne s'affichent pas tant que les images ne sont pas replacées dans :

```
public/assets/images
```

---

# Auteur

Projet réalisé par **Yazan** dans le cadre de la formation **OpenClassrooms**.
