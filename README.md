1. Prerrequisitos
Asegúrate de tener instalados:

Node.js (Versión 14 o superior)
Git
SQL Server (o la base de datos que hayas configurado)
SQL Server Management Studio (opcional, si deseas administrar la base de datos de manera visual)
2. Clona el repositorio
En la terminal, clona el repositorio de tu proyecto backend:


git clone <URL_DE_TU_REPOSITORIO>
Reemplaza <URL_DE_TU_REPOSITORIO> con la URL del repositorio de Git.

3. Accede al directorio del proyecto
cd nombre-del-directorio
Sustituye nombre-del-directorio por el nombre de la carpeta donde se clonó el repositorio.

4. Instala las dependencias
Usa npm o yarn para instalar las dependencias:

# Usando npm
npm install

# O usando yarn
yarn install
5. Configura las variables de entorno
Crea un archivo .env en la raíz del proyecto. Este archivo contendrá las configuraciones necesarias para conectarte a la base de datos y otras configuraciones del backend. Ejemplo:

DB_HOST=localhost
DB_USER=nombre_usuario
DB_PASSWORD=contraseña
DB_NAME=nombre_base_datos
PORT=3000
JWT_SECRET=tu_secreto_jwt
Asegúrate de reemplazar estos valores con la configuración correcta para tu entorno.

6. Inicia el servidor de desarrollo
Para levantar el servidor, utiliza el siguiente comando:

# Usando npm
npm run dev

# O usando yarn
yarn dev
Esto levantará el servidor de desarrollo y lo dejará escuchando en el puerto que especificaste en el archivo .env (generalmente http://localhost:3000).

7. Prueba la API
Puedes probar los endpoints de tu API usando herramientas como Postman o Insomnia, o también directamente desde tu frontend si ya está integrado.

Notas adicionales
Migraciones de base de datos: Si tu proyecto utiliza migraciones, asegúrate de ejecutarlas antes de iniciar el servidor para que la base de datos esté configurada correctamente.
Revisa los logs: Si ocurre algún problema al iniciar el servidor, verifica los mensajes en la terminal para obtener pistas sobre posibles errores.
