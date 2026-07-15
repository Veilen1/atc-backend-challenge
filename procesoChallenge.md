## Resolución del Desafío Técnico - Alquila Tu Cancha

### Análisis Inicial y Verificación

Para comenzar, levanté el entorno usando `docker-compose up`. Comprobé el comportamiento actual de la aplicación realizando una petición de prueba mediante curl hacia el endpoint `/search`. Pude verificar que la API funciona, pero tal como indica la premisa del desafío, la latencia es extremadamente alta debido a las consultas secuenciales al servicio mock.

### Arquitectura

Decidí respetar la Arquitectura Hexagonal y de módulos (CQRS) ya planteada en el proyecto base para mantener la coherencia y buenas prácticas. La estructura se mantiene así:

- **Domain:** Capa de negocio, contiene los modelos, eventos y handlers.
- **Infrastructure:** Capa de infraestructura, aloja los clientes externos y repositorios concretos.
- **Application (Controllers):** Capa que orquesta el flujo de entrada y salida, donde se ubican los controladores que reciben las peticiones HTTP.

### Problemas de Entorno y Trade-offs

Al iniciar el desarrollo, detecté una inconsistencia en el repositorio base: el `package.json` exigía de forma estricta la versión de Node `16.17.0`, mientras que el `Dockerfile` apuntaba a la etiqueta `16.17-alpine` (la cual resuelve a `16.17.1`). Esto impedía que Yarn instalara las dependencias correctamente.

Para solucionarlo de forma pragmática en el contexto de este desafío, decidí fijar la versión exacta `16.17.0-alpine` en el `Dockerfile` y utilizar la bandera `--ignore-engines` al instalar nuevas dependencias como `cache-manager`, ya que sus versiones más recientes exigen Node 18.

**Nota sobre buenas prácticas:** En un entorno empresarial real, modificar la versión base de Node en un Dockerfile sin previo aviso puede causar problemas de compatibilidad en los flujos de CI/CD. La solución correcta en un escenario de producción hubiera sido debatir con el equipo para relajar la regla del `package.json`, o bien investigar e instalar versiones antiguas de las librerías de caché que ofrecieran soporte nativo para Node 16.

### Infraestructura de Caché

Debido al estricto límite de cuota (60 peticiones por minuto) y a la alta latencia del servicio mock, la solución más viable es implementar una capa de caché persistente. Se optó por Redis.

Para integrarlo limpiamente, desarrollé lo siguiente bajo el principio de inversión de dependencias:

- **Puerto (Domain):** Se creó la interfaz `AvailabilityRepository` que define el contrato abstracto para guardar y obtener clubes, canchas y turnos (slots).
- **Adaptador (Infrastructure):** Se creó la clase `RedisAvailabilityRepository` que implementa dicha interfaz utilizando el gestor de caché de NestJS conectado a Redis. Se configuró un tiempo de vida (TTL) de 8 días como medida de seguridad, cubriendo adecuadamente la ventana de 7 días exigida por el desafío.
- **Configuración:** Se importó e inyectó todo esto a nivel de aplicación en el `AppModule`.
