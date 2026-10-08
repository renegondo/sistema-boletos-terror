# 🎟️ Hi-Boletos Express

Una versión simplificada y de alto rendimiento inspirada en [hi.events](https://github.com/HiEventsDev/hi.events), adaptada para **eventos con taquilla física (POS)**, **generación de boletos digitales con código QR**, **envío automatizado por WhatsApp mediante Evolution API**, y **sistema de promotores / vendedores con comisiones (porcentaje o monto fijo)**.

---

## 🚀 Características Principales

1. **Gestión de Eventos y Zonas**:
   - Creación y edición de eventos con cartelera, fecha, horario, ubicación y flyer.
   - Múltiples tipos de entrada / zonas por evento (General, VIP, Backstage) con precios y cupos independientes.

2. **Taquilla Física (Punto de Venta POS)**:
   - Cobro presencial ágil con cálculo en tiempo real.
   - Métodos de pago: Efectivo (con calculadora de cambio), Tarjeta en terminal y Transferencia.
   - Datos del asistente y número de WhatsApp con selector de país.
   - Previsualización en vivo de la comisión que ganará el vendedor en esa venta.

3. **Boletos Digitales con Código QR**:
   - Tarjetas de acceso estéticas con diseño de festival/concierto.
   - Código QR dinámico de alta resolución para cada entrada.
   - Folio único de seguridad (`TKT-XXXXXX`).
   - Descarga instantánea en formato PNG de alta resolución.

4. **Integración con Evolution API (WhatsApp)**:
   - Envío automático de la imagen del boleto + mensaje con detalles del evento al WhatsApp del comprador.
   - Compatible con cualquier servidor de Evolution API (Baileys).
   - Botón de reenvío con un solo clic en caso de contingencia.
   - Panel de configuración con herramienta para **probar conexión en vivo**.

5. **Sistema de Vendedores / Promotores (RPs) & Comisiones**:
   - Asignación flexible por vendedor:
     - **Porcentaje (%)**: Por ejemplo, 10% del total vendido.
     - **Monto Fijo ($)**: Por ejemplo, $50 MXN por cada boleto emitido.
   - **Portal para cada vendedor**:
     - Resumen en tiempo real de boletos vendidos y dinero recaudado.
     - Total de comisión ganada y saldo pendiente por liquidar.
     - Historial completo de ventas y boletos emitidos.
   - **Panel Administrativo**:
     - Vista global de todos los RPs y sus ganancias acumuladas.
     - Módulo de **Liquidación de Comisiones** (registro de pagos realizados con notas y comprobante).

6. **Control de Acceso & Validador QR**:
   - Pantalla de puerta/seguridad para validar boletos mediante escáner o pistola de código de barras.
   - Sistema anti-fraude: detecta inmediatamente si el boleto ya fue ingresado con fecha y hora exacta.

---

## 🛠️ Tecnologías Utilizadas

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Base de Datos**: SQLite nativo integrado (`node:sqlite`) – *Cero dependencias pesadas, ultra rápido y persistente en `data/boletos.db`*
- **Autenticación**: JWT con cookies seguras y control de roles (`admin` y `vendor`)
- **Estilos**: Tailwind CSS con diseño moderno en modo oscuro
- **QR Code**: Motor de generación de códigos QR vectorial y canvas
- **WhatsApp API**: Módulo de integración HTTP con Evolution API v1/v2

---

## 🏁 Inicio Rápido

### 1. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre tu navegador en: [http://localhost:3000](http://localhost:3000)

---

## 🔑 Credenciales de Acceso Preconfiguradas

| Rol | Correo | Contraseña | Esquema de Comisión |
|---|---|---|---|
| **Administrador General** | `admin@boletos.com` | `admin123` | Control total del sistema |
| **Vendedor 1 (Carlos RP)** | `carlos@boletos.com` | `vendedor123` | **10%** por venta |
| **Vendedor 2 (Ana RP)** | `ana@boletos.com` | `vendedor123` | **$50.00 fija** por boleto |

*(En la pantalla de inicio de sesión dispones de botones de 1-clic para autocompletar estas cuentas y probar inmediatamente).*

---

## 📱 Configurar Evolution API (WhatsApp)

1. Inicia sesión como **Administrador** (`admin@boletos.com`).
2. Dirígete a la pestaña **Evolution API** (`/configuracion`).
3. Ingresa:
   - **URL del Servidor**: Ej. `http://localhost:8080` o tu servidor en la nube.
   - **API Key**: Tu clave `AUTHENTICATION_API_KEY`.
   - **Nombre de Instancia**: La sesión creada en Evolution API (ej. `boletos_instance`).
4. Haz clic en **"Probar Conexión Ahora"** para verificar que tu WhatsApp esté enlazado.
5. Activa la casilla **"Envío automático de boletos al cobrar"**.

---

## 📁 Estructura del Proyecto

```
sistema boletos/
├── data/                    # Base de datos SQLite (boletos.db)
├── src/
│   ├── app/
│   │   ├── api/             # Endpoints REST (auth, pos, events, vendors, tickets, settings)
│   │   ├── configuracion/   # Ajustes de Evolution API
│   │   ├── eventos/         # Gestión de cartelera y tipos de boletos
│   │   ├── login/           # Pantalla de acceso con roles
│   │   ├── pos/             # Taquilla física y cobro presencial
│   │   ├── scanner/         # Validador de acceso QR
│   │   ├── vendedores/      # Panel de comisiones y liquidaciones
│   │   ├── layout.tsx       # Layout principal
│   │   └── page.tsx         # Dashboard adaptativo según rol
│   ├── components/
│   │   └── Navbar.tsx       # Barra de navegación con estado de sesión
│   ├── lib/
│   │   ├── db.ts            # Motor SQLite y migraciones automáticas
│   │   ├── auth.ts          # Manejo de JWT y sesión
│   │   ├── evolution.ts     # Integración con Evolution API
│   │   ├── ticket-generator.ts     # Renderizador de boletos SVG y QR
│   │   └── client-ticket-canvas.ts # Generador de boletos en PNG con canvas
│   └── types/               # Tipos TypeScript
└── package.json
```
