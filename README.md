# Curious Data RNG

Generador de datos curiosos con interfaz sci-fi, cifrado AES-128-GCM y protección de integridad.

## Características

- Animación de intro + barra de carga durante el descifrado
- Slot machine de tags
- Carta con scroll para textos largos
- Formulario `data.html` (secciones con viñetas)
- Dataset completo cifrado en un solo `data/data.json` (AES-128-GCM)
- Si el archivo no se puede descifrar → pantalla de bloqueo
- PWA instalable + sonidos Web Audio

## Estructura

```
Curious Data RNG/
├── index.html
├── data.html
├── sw.js
├── manifest.json
├── Versions.txt
├── README.md
├── icons/
│   ├── 192.png
│   └── 512.png
└── data/
    └── data.json   ← binario cifrado (se crea al guardar el primer dato)
```

## Uso

1. Sirve el proyecto (GitHub Pages, `npx serve`, Live Server…)
2. Abre `data.html` → añade datos → descarga `data.json` cifrado
3. Coloca el archivo en la carpeta `data/`
4. Abre `index.html` → la barra de carga descifra los datos

## Seguridad

- AES-128-GCM + PBKDF2 (100.000 iteraciones)
- Contraseña por defecto: `CuriousData2026Oscar!`
  (cámbiala en `index.html` y `data.html` si quieres)
- Salt: `curious-data-salt-v2`

## Autor

Developed By Oscar
