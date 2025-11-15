# 📚 Sistema de Gestión de Biblioteca

Una aplicación web frontend para gestionar una biblioteca, desarrollada con JavaScript vanilla que consume una API RESTful de Flask.

## 🚀 Características

- **Gestión de Libros, Autores, Usuarios y Préstamos**
- **Sistema de roles**: Administrador, Editor y Usuario
- **Interfaz responsive** con JavaScript puro
- **API RESTful** con autenticación JWT

## 👥 Usuarios de Prueba

Estos usuarios están pre-creados en la base de datos para realizar pruebas:

| Usuario | Contraseña | Rol | Permisos |
|---------|------------|-----|----------|
| `admin@biblioteca.com` | `admin123` | Administrador | Acceso completo a todas las funciones |
| `editor@biblioteca.com` | `editor123` | Editor | Gestionar libros, autores y préstamos |
| `usuario@biblioteca.com` | `user123` | Usuario | Solo consultar libros y autores |

## ⚙️ Configuración

### 1. Variables de Entorno

Modifica el archivo index.html en la raíz del proyecto con la URL de la api según la que tengas en tu github codespace:

```html
<script>
        // Configuración global - ACTUALIZA ESTA URL
        window.APP_CONFIG = {
            API_BASE_URL: 'https://tu-backend-flask.ejemplo.com'
        };
    </script>
```

**Importante:** Reemplaza ***https://tu-backend-flask.ejemplo.com*** con la URL real de tu backend Flask.

### 2. Instalación y Ejecución

```bash
# Ejecutar el servidor de desarrollo
python -m http.server 8000 --bind 0.0.0.0
```

### 3. Configuración en GitHub Codespaces
1. Ejecuta el comando anterior

2. Ve a la pestaña "Ports" en Codespaces

3. Busca el puerto 8000

4. Haz clic derecho en el puerto y selecciona "Port Visibility" → "Public"

5. Haz clic en el icono del globo terráqueo 🌐 para abrir la aplicación

## Estructura del Proyecto

```text
LIBRARYFRONTEND/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── controllers
│   ├── services
│   ├── shared
├── .env
├── index.html
├── admin.html
├── auth.html
├── authors.html
├── profile.html
├── loans.html
├── dashboard.html
├── books.html
├── .gitignore
└── README.md
```

## 🔐 Funcionalidades por Rol

### 👤 Usuario Regular

- ✅ Consultar catálogo de libros

- ✅ Buscar y filtrar libros

- ✅ Ver información de autores

- ❌ Gestionar préstamos

- ❌ Modificar datos

### ✏️ Editor
- ✅ Todas las funciones de Usuario

- ✅ Gestionar préstamos (crear, devolver)

- ✅ Agregar y editar libros

- ✅ Gestionar autores

- ❌ Administrar usuarios

### 👑 Administrador
- ✅ Todas las funciones anteriores

- ✅ Gestión completa de usuarios

- ✅ Reportes y estadísticas

- ✅ Configuración del sistema

## 🌐 Consumo de API
El frontend consume la API mediante fetch:

```javascript
javascript
// Ejemplo de consumo de API
const response = await fetch(`${API_BASE_URL}/books`, {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});
const books = await response.json();
```

## 🚨 Solución de Problemas
### Error: "Cannot GET /"
* Verifica que el archivo index.html exista en el directorio raíz

* Asegúrate de ejecutar el servidor desde el directorio correcto

### Error: "Connection refused"
* Verifica la URL del backend en el archivo .env

* Asegúrate de que el servidor Flask esté ejecutándose

### Error: CORS
* El backend Flask debe tener configurado CORS para aceptar requests del frontend

### Los puertos no son accesibles
* En Codespaces, asegúrate de que los puertos estén marcados como "Public"

## 📝 Notas para el Maestro
* Backend separado: El frontend está completamente separado del backend

* Variables de entorno: Es necesario configurar el archivo .env con la URL correcta del backend

* Autenticación: El sistema usa JWT tokens para la autenticación

* Roles predefinidos: Use los usuarios proporcionados para probar diferentes niveles de acceso(en caso de que los usuarios predefinidos con roles no se ejecuten correctamente, porfavor, ejecutar archivo 'create_users.py' desde la api).

* Responsive: La interfaz se adapta a diferentes tamaños de pantalla

## 🎯 Pruebas Recomendadas
* Iniciar sesión con cada uno de los tres roles y explorar las diferencias

* Consultar libros y usar la función de búsqueda

* Probar los permisos intentando acceder a funciones no permitidas

* Verificar la responsividad en diferentes dispositivos

* Desarrollado con 🐍 Flask (Backend) + ⚡ JavaScript Vanilla (Frontend)