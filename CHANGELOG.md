# Changelog v3.2.2 - Mapa Operativo RED

## 🎨 [3.2.2] - 2026-08-23

### ✨ Cambios principales

#### Sistema de Diseño Completo
- ✅ **7 archivos CSS modularizados** (~2,830 líneas)
- ✅ **Design tokens** para colores, tipografía, espaciado
- ✅ **Sistema de componentes** reutilizable (botones, tarjetas, badges, alertas)
- ✅ **Layout moderno** con sidebar, header, dock y contenido principal
- ✅ **Tema claro (Light mode)** completo y profesional

#### Identidad Institucional RED
- ✅ Paleta corporativa ampliada y coherente
- ✅ Tipografía profesional (Space Grotesk + Inter)
- ✅ Branding consistente en header y navegación
- ✅ Colores de estados (éxito, error, advertencia, info)

#### Experiencia de Usuario
- ✅ Navegación intuitiva con sidebar principal y dock inferior
- ✅ Pantalla de inicio elegante con modos de consulta
- ✅ Componentes visuales refinados (cards, badges, alertas)
- ✅ Feedback visual en interacciones (hover, focus, active)
- ✅ Animaciones sutiles y fluidas

#### Accesibilidad (WCAG AA)
- ✅ Contraste de colores validado (mínimo 4.5:1)
- ✅ Navegación por teclado completa
- ✅ Focus visible en todos los elementos interactivos
- ✅ Respeto a `prefers-reduced-motion`
- ✅ Respeto a `prefers-color-scheme`
- ✅ Semántica HTML5 correcta

#### Responsivo
- ✅ Breakpoints: 480px, 768px, 1024px, 1440px
- ✅ Mobile-first approach
- ✅ Drawer sidebar en tablets
- ✅ Ajuste de tipografía por pantalla
- ✅ Imágenes y tablas adaptables

### 📁 Estructura de archivos

```
assets/css/
├── 01-design-system.css      (420 líneas) - Variables, tipografía, espaciado
├── 02-components.css         (430 líneas) - Botones, campos, tarjetas, badges
├── 03-layout.css             (450 líneas) - Header, sidebar, dock, grid
├── 04-theme-light.css        (380 líneas) - Inicio y tema claro
├── 05-maps-and-tables.css    (380 líneas) - Mapas, tablas, filtros
├── 06-panels-and-modals.css  (420 líneas) - Solapas, drawers, modales
└── 07-animations.css         (350 líneas) - Transiciones, efectos

index-v3.2.2.html             Nueva versión HTML restructurada
DESIGN_SYSTEM.md               Guía completa de diseño
CHANGELOG.md                   Este archivo
```

### 🎨 Paleta de colores

#### Primaria (RED)
```
#d3301f - Red institucional
#a12314 - Red oscuro
#f5e5e2 - Red light
#fbeae7 - Red pale
```

#### Secundaria
```
#1e5aa8 - Blue (rutas Ida)
#157a4a - Green (éxito)
#b9790f - Amber (advertencia)
#b3261e - Red error
```

#### Neutros
```
#10161b - Ink (principal)
#5b6b74 - Text muted (secundario)
#b0bcc4 - Text light (deshabilitado)
#ffffff - White (fondos)
```

### 🔤 Tipografía

- **Display**: Space Grotesk (títulos, headings)
- **Body**: Inter (cuerpo, UI)
- **Mono**: IBM Plex Mono (datos, horarios, códigos)

### 📐 Espaciado (8px grid)

```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-6: 24px
--space-8: 32px
```

### 🧩 Componentes incluidos

#### Botones
- `btn-primary` - Acción principal
- `btn-secondary` - Acción alterna
- `btn-tertiary` - Acción sutil
- `btn-ghost` - Mínimo
- `btn-danger` - Destructiva
- Tamaños: `btn-sm`, (default), `btn-lg`

#### Formularios
- `form-input` - Campos de texto
- `form-select` - Selectores
- `form-textarea` - Áreas de texto
- `form-label` - Etiquetas
- `form-hint` - Ayuda
- `form-error` - Mensajes de error

#### Tarjetas
- `.card` - Tarjeta base
- `.card-compact` - Versión compacta
- `.card-header` - Encabezado
- `.card-body` - Contenido
- `.card-footer` - Pie

#### Badges & Alerts
- Badges: `badge-primary`, `badge-success`, `badge-warning`, `badge-error`
- Alertas: `alert-success`, `alert-warning`, `alert-error`, `alert-info`

#### Layout
- `.app-wrapper` - Contenedor principal
- `.app-header` - Encabezado
- `.app-sidebar` - Barra lateral
- `.app-main` - Contenido principal
- `.app-dock` - Navegación inferior

#### Utilidades
- Grid: `.grid`, `.grid-cols-1/2/3/4`
- Flex: `.flex`, `.flex-col`, `.flex-between`, `.flex-center`
- Espaciado: `.p-2`, `.p-4`, `.m-2`, `.mb-4`, `.gap-4`
- Transiciones: `.transition-all`, `.hover-lift`, `.fade-in`

### 🔄 Cambios desde v2.3.0

#### Nuevas características
- Sistema de design tokens centralizado
- Componentes reutilizables y modulares
- Nuevo layout con sidebar + dock
- Pantalla de inicio profesional
- Animaciones y microinteracciones
- Dark mode preparation
- Accesibilidad mejorada (WCAG AA)

#### Eliminado
- Mezcla de estilos inline en HTML
- Uso inconsistente de espaciado
- Colores hardcoded

#### Mejorado
- Legibilidad del código CSS
- Mantenibilidad y escalabilidad
- Rendimiento (colores como variables)
- Experiencia de usuario

### 🚀 Cómo usar

#### Instalación
1. Usar `index-v3.2.2.html` como punto de partida
2. Incluir todos los archivos CSS en orden
3. Integrar lógica JavaScript existente

#### Ejemplo básico
```html
<!-- Botón primario -->
<button class="btn btn-primary">Guardar</button>

<!-- Tarjeta -->
<div class="card">
  <h3 class="card-title">Información</h3>
  <p>Contenido</p>
</div>

<!-- Grid -->
<div class="grid grid-cols-2 gap-4">
  <div>Columna 1</div>
  <div>Columna 2</div>
</div>
```

### ✅ Testing

- ✅ Validación de contraste WCAG AA
- ✅ Navegación por teclado (Tab, Enter, Escape)
- ✅ Responsive en 480px, 768px, 1024px
- ✅ Focus visible en todos los controles
- ✅ Animaciones respetan prefers-reduced-motion

### 📚 Documentación

Ver `DESIGN_SYSTEM.md` para:
- Guía completa de diseño
- Ejemplos de componentes
- Patrones recomendados
- Mejores prácticas

### 🔮 Próximas versiones

**v3.2.3** (Integración JavaScript)
- Funcionalidad de componentes interactivos
- Navegación entre tabs
- Modal dialogs
- Toast notifications

**v3.3.0** (Dark mode)
- Tema oscuro completo
- Toggle light/dark
- Persistencia de preferencia

**v3.4.0** (Sistema de iconos)
- SVG sprite de iconos
- Variaciones de tamaño
- Animaciones de iconos

---

**Rama:** `feature/v3.2.2-redesign`
**Commits:** 3 principales
**Líneas de código:** +2,830 CSS, +550 HTML, +270 Markdown
**Tiempo de desarrollo:** Optimizado con modularidad
