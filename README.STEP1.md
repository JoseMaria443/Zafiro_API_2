# Paso 1 - Migracion a Clerk-only en Auth y Users

Fecha de ejecucion: 2026-03-14

## Objetivo

Dejar la autenticacion del backend alineada con Clerk como unica fuente de identidad y eliminar la dependencia del JWT interno y de la contrasenna local en el flujo de usuarios.

## Cambios realizados

- `AuthMiddleware` ahora valida exclusivamente el token Bearer con Clerk.
- `LoginUserUseCase` ya no genera JWT interno ni soporta login por correo/contrasenna.
- `User` y `IUserRepository` quedaron sin campo `password` ni `passwordHash`.
- `MySqlUserRepository` fue alineado con la tabla `usuarios` sin columna `contrasenna`.
- `AuthController` ya no devuelve `token` en `login`, `loginSession` y `registerSession`.
- `AuthController.register()` devuelve `410 Gone` para dejar explicito que el registro legacy ya no se soporta.
- `UpdateUserUseCase` y `AuthController.update()` dejaron de manejar contrasenna.
- Se elimino el wiring legacy de `RegisterUserUseCase` en `app.ts`.
- La firma del `state` de Google OAuth ahora exige secreto configurado en entorno.

## Impacto esperado en frontend

- El frontend debe seguir enviando `Authorization: Bearer <ClerkToken>`.
- Ya no debe esperar `token` propio de la API en las respuestas de sesion.
- El alta o sincronizacion del usuario ocurre a traves de `POST /api/auth/session` o `POST /api/auth/register/session`.

## Pendiente para el paso 2

- Cerrar rutas publicas de actividades.
- Evitar que el cliente mande `idUsuario` arbitrario para crear o borrar actividades.
