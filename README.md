# Curious Data RNG

Generador de datos curiosos con interfaz sci-fi, cifrado AES-128-GCM y verificación de integridad.

**Developed By Oscar**

---

## Características

- Hub de entrada con fade-in, barra de carga y fade-out
- Verificación de integridad de `data.json` (si está corrupto o modificado → bloqueo)
- Generador tipo slot + cartas con scroll para textos largos
- Formulario para añadir datos con secciones y viñetas ilimitadas
- Dataset completo cifrado en un solo archivo `data/data.json`
- PWA instalable (manifest + service worker)
- Sonidos sci-fi con Web Audio API (botón 🔊)

---

## Estructura del proyecto

```
Curious Data RNG/
├── index.html          # Hub: intro + verificación + menú
├── RNG.html            # Generador de cartas (sin intro)
├── data.html           # Formulario para añadir datos
├── css/
│   ├── hub.css         # Estilos del menú principal
│   ├── rng.css         # Estilos del generador
│   └── data.css        # Estilos del formulario
├── js/
│   ├── crypto.js       # AES-128-GCM + sesión verificada
│   ├── hub.js          # Lógica del index
│   ├── rng.js          # Lógica del generador
│   └── data.js         # Lógica del formulario
├── data/               # data.json cifrado (vacía al inicio)
├── icons/
│   ├── 192.png
│   └── 512.png
├── sw.js               # Service Worker
├── manifest.json       # Manifest PWA
├── Versions.txt        # Historial de versiones
└── README.md           # Este archivo
```

---

## Flujo de uso

1. Abre **`index.html`**
2. Se muestra la intro y se verifica `data/data.json`
3. Elige:
   - **RNG** → generador de datos
   - **DATA** → añadir nuevos datos

### Local (`file://` en el teléfono o PC)

1. En `data.html` guarda un dato → se descarga `data.json`
2. En el menú (o en RNG) usa **Cargar data.json cifrado**
3. Elige el archivo descargado

### GitHub Pages (`https`)

1. En `data.html` guarda un dato → se descarga `data.json`
2. Súbelo a `data/data.json` en el repositorio (reemplaza el anterior)
3. `index.html` lo lee y verifica automáticamente

---

## Seguridad

| Elemento | Detalle |
|----------|---------|
| Algoritmo | AES-128-GCM |
| Derivación | PBKDF2-SHA256 (100.000 iteraciones) |
| Archivo | `data/data.json` (binario cifrado, no texto) |
| Si falla el descifrado | Pantalla de bloqueo |

Contraseña por defecto (cámbiala en `js/crypto.js` si quieres):

```
CuriousData2026Oscar!
```

Salt:

```
curious-data-salt-v2
```

---

## Formato de un dato

```json
{
  "title": "La Saliva Humana",
  "fact": "Descripción principal...",
  "sections": [
    {
      "title": "Componentes antibacterianos",
      "bullets": [
        "Lisozima: ...",
        "Lactoferrina: ..."
      ]
    }
  ],
  "tags": ["Biología"],
  "key": "K..."
}
```

---

## Requisitos

- Navegador moderno (Chrome / Edge / Firefox)
- Web Crypto API
- Para lectura automática de archivos: servidor HTTP (GitHub Pages, Live Server, etc.)

---

## Versión

Consulta `Versions.txt` para el historial completo.

**Actual: 3.0.0**
