## Zafiro API

Backend REST en Node.js, TypeScript y Express para usuarios, actividades, etiquetas, prioridades y sincronización con Google Calendar.

## Stack

- Node.js
- TypeScript
- Express
- PostgreSQL con `pg`
- Clerk para autenticación
- Google Calendar API para integración de calendario

## Arquitectura

El proyecto está organizado por contextos y capas:

- `Domain`: entidades y contratos
- `Application`: casos de uso
- `Infrastructure`: controllers, repositorios y servicios externos

Contextos principales:

- `Users`
- `Activities`
- `Tags`
- `Priorities`
- `Shared`

## Configuración

Instalación:

```bash
npm install
```
