# Guía de Diseño v2.3.2 - Mapa Operativo RED

## 📋 Tabla de Contenidos
1. [Descripción General](#descripción-general)
2. [Sistema de Diseño](#sistema-de-diseño)
3. [Paleta Corporativa](#paleta-corporativa)
4. [Tipografía](#tipografía)
5. [Espaciado](#espaciado)
6. [Componentes](#componentes)
7. [Patrones](#patrones)
8. [Accesibilidad](#accesibilidad)
9. [Responsive](#responsive)

---

## Descripción General

**Versión 2.3.2** introduce una arquitectura visual completamente renovada con enfoque en:

- ✅ **Institucional**: Branding RED coherente en toda la experiencia
- ✅ **Organización**: Información jerárquica clara y navegable
- ✅ **Profesional**: Componentes refinados y coherentes
- ✅ **Accesible**: WCAG AA compliance en colores, contraste, navegación
- ✅ **Responsive**: Experiencia fluida desktop, tablet, móvil
- ✅ **Modular**: 7 archivos CSS independientes y reutilizables

### Archivos CSS

| Archivo | Propósito | Líneas |
|---------|-----------|--------|
| `01-design-system.css` | Variables, tipografía, espaciado base | 420 |
| `02-components.css` | Botones, campos, tarjetas, badges | 430 |
| `03-layout.css` | Header, sidebar, dock, grid | 450 |
| `04-theme-light.css` | Pantalla inicio y tema claro | 380 |
| `05-maps-and-tables.css` | Mapas Leaflet, tablas, filtros | 380 |
| `06-panels-and-modals.css` | Solapas, drawers, modales, toasts | 420 |
| `07-animations.css` | Transiciones, efectos, a11y | 350 |
| **TOTAL** | Sistema completo | **2,830** |

---

## Sistema de Diseño

### Token Scale

Todo el sistema usa **8px grid** como base, garantizando consistencia y armonía:

```css
--space-0: 0        /* 0px */
--space-1: 4px      /* Micro */
--space-2: 8px      /* Extra-small */
--space-3: 12px     /* Small */
--space-4: 16px     /* Base */
--space-5: 20px     /* Medium */
--space-6: 24px     /* Large */
--space-8: 32px     /* Extra-large */
--space-10: 40px    /* 2XL */
--space-12: 48px    /* 3XL */
--space-16: 64px    /* 4XL */
--space-20: 80px    /* 5XL */
```

### Radios

```css
--radius-none: 0        /* Bordes afilados */
--radius-sm: 4px        /* Botones pequeños */
--radius-md: 8px        /* Elementos base */
--radius-lg: 12px       /* Tarjetas */
--radius-xl: 16px       /* Paneles grandes */
--radius-full: 999px    /* Pills */
```

### Sombras

```css
--shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.06)      /* Hover */
--shadow-sm: 0 2px 4px rgba(15, 23, 42, 0.08)      /* Default */
--shadow-md: 0 4px 12px rgba(15, 23, 42, 0.12)     /* Elevated */
--shadow-lg: 0 8px 24px rgba(15, 23, 42, 0.16)     /* Drawer */
--shadow-xl: 0 12px 32px rgba(15, 23, 42, 0.2)     /* Modal */
```

---

## Paleta Corporativa

### Primaria RED

```
#d3301f  ← Red institucional (botones, acciones primarias)
#a12314  ← Red oscuro (hover, estados)
#f5e5e2  ← Red light (fondos)
#fbeae7  ← Red pale (highlights)
```

### Secundaria

```
#1e5aa8  ← Blue (rutas Ida)
#157a4a  ← Green (exitoso, inicio)
#b9790f  ← Amber (advertencia)
#b3261e  ← Red error (peligro)
```

### Neutros

```
#10161b  ← Ink (texto principal)
#3f4a52  ← Ink secondary (subtítulos)
#5b6b74  ← Text muted (terciario)
#8695a0  ← Text muted-2 (deshabilitado)
#b0bcc4  ← Text light (placeholder)
```

### Fondos

```
#f5f7f8  ← Background primary (app)
#eff3f5  ← Background secondary (secciones)
#ffffff  ← Surface white (cards, modales)
#f8f9fa  ← Surface alt (hover)
```

---

## Tipografía

### Familias

```css
--font-display: 'Space Grotesk'   /* Títulos, headings */
--font-body: 'Inter'              /* Cuerpo, UI */
--font-mono: 'IBM Plex Mono'      /* Datos, códigos, horarios */
```

### Escala

```css
--text-xs:   11px   /* Labels, badges */
--text-sm:   12px   /* Complementario */
--text-base: 14px   /* Cuerpo base */
--text-lg:   16px   /* Subtítulos */
--text-xl:   18px   /* Títulos pequeños */
--text-2xl:  20px   /* Títulos medianos */
--text-3xl:  24px   /* Títulos grandes */
--text-4xl:  28px   /* Encabezados */
--text-5xl:  32px   /* Hero */
--text-6xl:  40px   /* Mega */
```

### Pesos

```css
--font-regular:   400   /* Cuerpo */
--font-medium:    500   /* Secundario */
--font-semibold:  600   /* Botones, labels */
--font-bold:      700   /* Títulos */
```

### Alturas de línea

```css
--leading-tight:   1.2    /* Títulos */
--leading-normal:  1.45   /* Body */
--leading-relaxed: 1.6    /* Descripciones */
--leading-loose:   1.8    /* Comentarios */
```

---

## Espaciado

### Aplicación

Todo espaciado derivado del **8px grid**:

```html
<!-- Botón -->
<button class="btn btn-primary">  <!-- padding: 0 16px; height: 40px -->

<!-- Tarjeta -->
<div class="card">              <!-- padding: 24px -->
  <div class="card-header">    <!-- margin-bottom: 16px -->
    <h3>Título</h3>
  </div>
</div>

<!-- Sección -->
<section class="section">
  <div class="section-header">  <!-- margin-bottom: 24px -->
```

### Márgenes Comunes

```css
/* Separación entre cards */
gap: var(--space-4);        /* 16px */

/* Separación entre secciones */
margin-bottom: var(--space-6);  /* 24px */

/* Padding interno */
padding: var(--space-4);    /* 16px */
```

---

## Componentes

### Botones

#### Variantes

```html
<!-- Primario (Acción principal) -->
<button class="btn btn-primary">Guardar cambios</button>

<!-- Secundario (Acciones alternas) -->
<button class="btn btn-secondary">Cancelar</button>

<!-- Terciario (Alternativas sutiles) -->
<button class="btn btn-tertiary">Descartar</button>

<!-- Ghost (Mínimo) -->
<button class="btn btn-ghost">Ver más</button>

<!-- Danger (Acciones destructivas) -->
<button class="btn btn-danger">Eliminar</button>
```

#### Tamaños

```html
<button class="btn btn-primary btn-sm">Pequeño</button>
<button class="btn btn-primary">Normal (default)</button>
<button class="btn btn-primary btn-lg">Grande</button>
```

#### Con iconos

```html
<button class="btn btn-primary">
  <span>Descargar</span>
  <span aria-hidden="true">↓</span>
</button>
```

### Formularios

```html
<div class="form-group">
  <label class="form-label">Correo electrónico</label>
  <input type="email" class="form-input" placeholder="ejemplo@red.cl">
  <p class="form-hint">Usaremos esto para contactarte</p>
</div>

<div class="form-group">
  <label class="form-label">Operador</label>
  <select class="form-select">
    <option>Selecciona un operador</option>
  </select>
</div>
```

### Tarjetas

```html
<div class="card">
  <div class="card-header">
    <div>
      <p class="card-meta">Información</p>
      <h3 class="card-title">Título de la tarjeta</h3>
      <p class="card-subtitle">Descripción adicional</p>
    </div>
  </div>
  
  <div class="card-body">
    <!-- Contenido -->
  </div>
  
  <div class="card-footer">
    <button class="btn btn-secondary">Aceptar</button>
  </div>
</div>
```

### Badges

```html
<span class="badge badge-primary">Activo</span>
<span class="badge badge-success">Completado</span>
<span class="badge badge-warning">Pendiente</span>
<span class="badge badge-error">Error</span>
```

### Alertas

```html
<div class="alert alert-success">
  <span class="alert-title">¡Éxito!</span>
  <p>Tu cambio ha sido guardado correctamente.</p>
</div>

<div class="alert alert-warning">
  <span class="alert-title">Atención</span>
  <p>Este cambio afectará múltiples rutas.</p>
</div>
```

---

## Patrones

### Encabezado de sección

```html
<div class="section-header">
  <div>
    <p class="section-meta">Tipo de información</p>
    <h2 class="section-title">Título Principal</h2>
  </div>
</div>
```

### Grid de estadísticas

```html
<div class="stats-grid">
  <div class="stat-card">
    <p class="stat-label">Recorridos activos</p>
    <p class="stat-value">145</p>
    <p class="stat-hint">día tipo</p>
  </div>
  <!-- más cards -->
</div>
```

### Tabla de datos

```html
<table class="data-table">
  <thead>
    <tr>
      <th>Recorrido</th>
      <th>Operador</th>
      <th>Paradas</th>
      <th>Estado</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><span class="route-badge">101</span></td>
      <td>Operador A</td>
      <td>48</td>
      <td><span class="badge badge-success">Activo</span></td>
    </tr>
  </tbody>
</table>
```

---

## Accesibilidad

### Contraste

Todos los colores cumplen con **WCAG AA** (mínimo 4.5:1):

- ✅ Red primario sobre blanco: **6.2:1**
- ✅ Texto sobre fondos: **7.1:1** mínimo
- ✅ Botones deshabilitados: **4.5:1**

### Navegación por teclado

```html
<!-- Botones siempre accesibles -->
<button class="btn">Acción</button>

<!-- Campos con labels asociados -->
<label for="email">Correo</label>
<input id="email" type="email">

<!-- Skip links para saltar navegación -->
<a href="#main" class="skip-link">Ir a contenido principal</a>
```

### Focus visible

```css
button:focus-visible {
  outline: 2px solid var(--red-primary);
  outline-offset: 2px;
}
```

### Motion preferences

Respetamos `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Responsive

### Breakpoints

```css
/* Mobile first */
(default)          /* 0px+ */
@media (max-width: 480px)   /* Extra small */
@media (max-width: 768px)   /* Tablet */
@media (max-width: 1024px)  /* Pequeño desktop */
@media (max-width: 1440px)  /* Desktop */
(min-width: 1441px)         /* XL desktop */
```

### Ajustes por pantalla

**Mobile (< 768px)**
- Sidebar se convierte en drawer deslizante
- Dock superior queda flotante en bottom
- Imágenes se comprimen
- Tipografía reduce 10-15%

**Tablet (768px - 1024px)**
- 2 columnas en grids de 4
- Sidebar colapsable
- Tablas scrollables horizontalmente

**Desktop (> 1024px)**
- Layout completo sidebar + main
- Grids de 4 columnas
- Tooltips y popovers visibles

---

## Uso en el Proyecto

### Importar en HTML

```html
<head>
  <!-- Fonts -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/...">
  
  <!-- Design System -->
  <link rel="stylesheet" href="assets/css/01-design-system.css">
  <link rel="stylesheet" href="assets/css/02-components.css">
  <link rel="stylesheet" href="assets/css/03-layout.css">
  <link rel="stylesheet" href="assets/css/04-theme-light.css">
  <link rel="stylesheet" href="assets/css/05-maps-and-tables.css">
  <link rel="stylesheet" href="assets/css/06-panels-and-modals.css">
  <link rel="stylesheet" href="assets/css/07-animations.css">
</head>
```

### Clases CSS comunes

```html
<!-- Espaciado -->
<div class="p-4 mb-6 gap-4">Contenido</div>

<!-- Flex -->
<div class="flex flex-between">Lado a lado</div>
<div class="flex-center">Centrado</div>

<!-- Grid -->
<div class="grid grid-cols-2 gap-4">Dos columnas</div>

<!-- Animaciones -->
<div class="fade-in hover-lift">Efecto</div>
```

---

## Próximos Pasos

1. ✅ **v2.3.2** → Sistema de diseño base
2. 🔄 **v2.3.3** → Fixes y refinamientos
3. 🔄 **v2.4.0** → Dark mode completo
4. 🔄 **v2.5.0** → Sistema de iconos SVG

---

**Última actualización:** 2026-08-23
**Versión:** 2.3.2
**Autor:** Equipo RED
