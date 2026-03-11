# Les Petits Plats — Projet 7

Application front-end réalisée en **JavaScript vanilla** dans le cadre du projet **OpenClassrooms — Les Petits Plats**.

L'objectif du projet est de concevoir un **moteur de recherche de recettes fluide, rapide et maintenable**, puis de comparer **deux implémentations algorithmiques** afin de déterminer l'approche la plus pertinente.

---

# Objectifs du projet

- Intégrer l’interface à partir de la maquette fournie
- Implémenter la **recherche principale** sur les recettes
- Implémenter des **filtres dynamiques par tags**
  - ingrédients
  - appareils
  - ustensiles

- Comparer **deux approches algorithmiques** pour la recherche principale
- Produire une **fiche d’investigation** avec benchmark et recommandation finale

---

# Stack technique

- HTML5
- CSS3
- JavaScript (vanilla)
- Dataset local en JSON (`recipes.js`)
- Aucun framework JavaScript
- Aucun build tool

Le projet fonctionne **entièrement côté client**.

---

# Fonctionnalités principales

- Barre de recherche principale

- Recherche active à partir de **3 caractères**

- Recherche multi-mots
  Exemple : `poulet coco`

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

Implémentation utilisant les méthodes natives de tableau :

- `filter`
- `map`
- `every`

### Avantages

- code plus lisible
- plus déclaratif
- plus facile à maintenir

---

## 2) Approche par boucles natives

Implémentation utilisant :

- `for`
- conditions
- `break` anticipé

### Avantages

- contrôle plus direct du parcours
- léger gain en vitesse brute dans certains scénarios

---

# Résultats benchmark (résumé)

Les performances des deux implémentations ont été comparées à l’aide de **jsben.ch**, avec un dataset étendu à **500 recettes**.

Les résultats montrent que :

- les **boucles natives** obtiennent généralement les meilleures performances
- l’écart reste **limité dans la plupart des scénarios**

Dans ce contexte, l’approche **fonctionnelle** a été retenue pour ce projet car elle offre le meilleur compromis entre :

- lisibilité
- maintenabilité
- évolutivité
- performance suffisante pour le volume de données actuel

L’approche par boucles reste pertinente si le dataset devient beaucoup plus important et qu’une optimisation micro-performante devient nécessaire.

---

# Arborescence du projet

```
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

---

# Lancer le projet

Le projet est **100% statique**.
Il n'y a **aucune installation npm** ni build à exécuter.

## Option 1 — VS Code + Live Server

1. Ouvrir le dossier du projet dans **VS Code**
2. Ouvrir `public/index.html`
3. Lancer **Open with Live Server**

---

## Option 2 — Serveur local Python

Depuis la racine du projet :

```bash
python -m http.server 5500
```

Puis ouvrir dans le navigateur :

```
http://localhost:5500/public/index.html
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
