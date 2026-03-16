# MyCalendar

Clone simplificado de Calendly para El Salvador.  
Stack: **React + Vite + Supabase + Tailwind CSS**, deploy en **Vercel**.

---

## Funcionalidades

| Feature | Descripción |
|---------|-------------|
| Crear evento | Título, descripción, enlace de reunión, rango de fechas, horario diario, días de semana y duración de slot |
| Página pública | Cualquiera puede ver los horarios disponibles y reservar con nombre + correo |
| Invitados | El reservador puede agregar correos de invitados adicionales |
| Tiempo real | Los slots reservados desaparecen al instante para todos los visitantes |
| Anti-colisión | Se verifica disponibilidad antes de guardar para evitar doble reserva |
| Panel del organizador | Ver todas las reservas, estadísticas, enlace público y código iframe |
| Embebible | Ruta `/embed/:slug` lista para poner en Moodle u otra página externa |

---

## Setup local

### 1. Clonar y instalar

```bash
git clone <repo>
cd mycalendar
npm install
```

### 2. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto gratuito.
2. En **SQL Editor**, pega y ejecuta todo el contenido de `supabase/schema.sql`.
3. En **Project Settings → API** copia:
   - `Project URL`
   - `anon public` key

### 3. Variables de entorno

```bash
cp .env.example .env
```

Edita `.env`:

```
VITE_SUPABASE_URL=https://TUPROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 4. Correr en desarrollo

```bash
npm run dev
```

Abre http://localhost:3000

---

## Deploy en Vercel

1. Sube el proyecto a GitHub.
2. En [vercel.com](https://vercel.com) → **New Project** → importa el repo.
3. En **Environment Variables** agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Framework preset: **Vite**. Click **Deploy**.

El archivo `vercel.json` ya maneja:
- Rewrite de todas las rutas a `index.html` (SPA routing).
- Headers para permitir iframe en `/embed/*`.

---

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Formulario para crear un evento |
| `/manage/:eventId` | Panel del organizador con reservas y links |
| `/book/:slug` | Página pública de reserva |
| `/embed/:slug` | Versión sin header para incrustar en iframe |

---

## Incrustar en Moodle

Desde el panel `/manage/:id` copia el código iframe y pégalo en cualquier recurso HTML de Moodle:

```html
<iframe src="https://tuapp.vercel.app/embed/mi-evento-abc12"
        width="100%" height="700" frameborder="0" allow="fullscreen">
</iframe>
```
