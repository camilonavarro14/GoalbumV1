# GoAlbum ⚽️🏆

**GoAlbum** es una aplicación web Full-Stack diseñada para gestionar, intercambiar y llevar el progreso de la colección de láminas (stickers) del Mundial 2026. 

Este documento describe la arquitectura global, las tecnologías utilizadas y el alcance del sistema, con especial énfasis en la **Fase 1** (Gestión de Usuarios y Láminas).

---

## 🚀 Fase 1: Usuarios y Mi Colección

La primera fase del proyecto está construida para tener un álbum funcional e interactivo:

### Funcionalidades Principales
1. **Gestión de Usuarios (Auth):** Registro e inicio de sesión para coleccionistas con una interfaz amigable.
2. **Tablero de la Colección (Dashboard):** 
   - Barra de progreso general para medir qué tan cerca estás de llenar el álbum.
   - Panel interactivo (Grid) para añadir y visualizar todas tus láminas.
   - Marcado de láminas entre "Únicas" y "Repetidas".
   - Filtros dinámicos para visualizar rápidamente tus cartas *faltantes* o *repetidas*.
3. **Centro de Intercambio (Trade Center):**
   - **Identificador Dinámico (QR / Link):** Generación de un código QR personal que condensa tu estado actual para compartir tu colección fácilmente.
   - **Match Inteligente:** Motor de comparación que cruza tu información con la de otro usuario para calcular automáticamente un acuerdo mutuo (*e.g., "Tú le sirves con 5 láminas, él te sirve con 3"*).

---

## 🎨 Diseño y Experiencia de Usuario (UI/UX)

La aplicación prioriza brindar una **experiencia premium** e inmersiva:

* **Paleta de Colores Mundialista:** Tonos vibrantes y ricos inspirados en el evento deportivo, utilizando verdes dinámicos y azules profundos con acentos dorados/neón para interacciones especiales o elementos únicos.
* **Glassmorphism:** Uso intensivo de fondos traslúcidos y desenfoques (blurs) para tarjetas de láminas, modales y barras de navegación, dándole un look moderno y vanguardista.
* **Micro-animaciones:** Transiciones fluidas en efectos hover sobre los stickers, apertura de configuraciones e interactividad que hacen sentir la app "viva".
* **Enfoque Mobile-First & Dark Mode:** Diseñado para sentirse como una app nativa en el celular, con soporte robusto para un Modo Oscuro donde los elementos neón destaquen con facilidad.

---

## 🛠 Arquitectura y Tecnología

El proyecto sigue lineamientos de Clean Architecture, separando bien las responsabilidades y alojando todo en contenedores para facilitar su despliegue y desarrollo:

### 1. Base de Datos (MongoDB)
* Base de datos NoSQL altamente escalable.
* Almacena usuarios, catálogo global de stickers, inventarios individuales y registros de intercambios.

### 2. Backend (NestJS)
* API RESTful construida con **Node.js** y **NestJS**.
* Lógica robusta que incluye autenticación (JWT) y los algoritmos complejos de comparación de inventarios en el **Trade Center**.

### 3. Frontend (React + Vite)
* SPA rápida utilizando **React** y construida con **Vite**.
* Estilizado con CSS nativo (Vanilla CSS Modules / variables CSS) para maximizar el desempeño de los efectos visuales (Glassmorphism y animaciones) sin marcos invasivos.

### 4. Infraestructura (Docker)
Todo el sistema está orquestado a través de **Docker Compose**, lo que levanta de forma simultánea:
* `mongo` (Base de datos)
* `api` (Backend - Puerto 3000)
* `web` (Frontend - Puertos 80 / 5173)

---

## 🏃 Cómo ejecutar el proyecto (Local)

Al tener toda la arquitectura dockerizada, el entorno de desarrollo se levanta con un solo comando situado en la raíz del proyecto:

```bash
docker-compose up --build
```

Esto desplegará los servicios y conectará el frontend con la API, listos para empezar a coleccionar e intercambiar láminas.
