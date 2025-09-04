<?php
/**
 * API: Crear Usuario en Oracle (JSON)
 *
 * Este script PHP maneja la creación de nuevos usuarios en la tabla SGU_USUARIO de Oracle.
 * Recibe los datos del usuario a través de una solicitud POST en formato JSON.
 *
 * Método: POST
 * Parámetros (en el cuerpo JSON):
 *  - name (string): Nombre del usuario.
 *  - email (string): Correo electrónico del usuario.
 *  - phone (string, opcional): Número de teléfono del usuario.
 *  - role (string): Rol del usuario ('alumnos', 'funcionarios', 'externos').
 *
 * Respuesta (200 OK):
 *  {
 *    "success": true,
 *    "message": "Usuario creado correctamente."
 *  }
 *
 * Errores (400 Bad Request, 405 Method Not Allowed, 500 Internal Server Error):
 *  {
 *    "success": false,
 *    "error": "Mensaje descriptivo del error."
 *  }
 */

// Establece el tipo de contenido de la respuesta como JSON y la codificación UTF-8.
header('Content-Type: application/json; charset=utf-8');
// Permite solicitudes desde cualquier origen (CORS). Ajustar en un entorno de producción para mayor seguridad.
header('Access-Control-Allow-Origin: *');
// Define los métodos HTTP permitidos para esta API.
header('Access-Control-Allow-Methods: POST');
// Define los encabezados permitidos en la solicitud.
header('Access-Control-Allow-Headers: Content-Type');

// Incluye el archivo de configuración de la base de datos.
require __DIR__ . '/config.php';

/**
 * @function handleRequest
 * @description Punto de entrada principal del script. Procesa la solicitud HTTP.
 */
// Verifica que la solicitud sea de tipo POST. Si no, devuelve un error 405.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['success' => false, 'error' => 'Método no permitido.']);
    exit;
}

// Obtiene el cuerpo de la solicitud HTTP y lo decodifica de JSON a un array asociativo PHP.
$input = json_decode(file_get_contents('php://input'), true);

/**
 * @section Data Validation
 * @description Realiza una validación básica de los datos recibidos.
 */
// Valida que los campos esenciales (nombre, email, rol) no estén vacíos.
if (empty($input['name']) || empty($input['email']) || empty($input['role'])) {
    http_response_code(400); // Bad Request
    echo json_encode([
        'success' => false,
        'error' => 'Faltan datos requeridos: nombre, email y rol.'
    ]);
    exit;
}

/**
 * @section Data Mapping and Default Values
 * @description Mapea los datos de entrada a variables y define valores por defecto.
 */
// Asigna los valores recibidos a variables locales.
$nombre = $input['name'];
$correo = $input['email'];
$telefono = $input['phone'] ?? null; // El teléfono es opcional, si no se envía, es null.

// Mapeo de los roles en texto (desde el frontend) a sus IDs numéricos correspondientes en la base de datos.
// ¡IMPORTANTE: Estos IDs deben coincidir con los de tu tabla de roles en Oracle!
$rol_map = [
    'alumnos' => 1,
    'funcionarios' => 2,
    'externos' => 3,
];
$rol_id = $rol_map[$input['role']] ?? null; // Obtiene el ID del rol; si el rol no es válido, es null.

// Si el rol proporcionado no se encuentra en el mapeo, devuelve un error 400.
if ($rol_id === null) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'El rol proporcionado no es válido.'
    ]);
    exit;
}

// Define valores fijos o por defecto para otras columnas de la tabla SGU_USUARIO.
// Estos valores son asumidos y pueden necesitar ser ajustados según tu esquema de base de datos.
$grp_id = 1; // ID de grupo por defecto.
$prs_id = 1; // ID de persona por defecto.
$usr_estado = 1; // Estado del usuario (1 = activo por defecto).

/**
 * @section Database Logic
 * @description Contiene la lógica para la conexión y manipulación de la base de datos.
 */

// Verifica si la extensión OCI8 de PHP está habilitada, que es necesaria para conectar con Oracle.
if (!function_exists('oci_connect')) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'La extensión OCI8 de PHP no está habilitada.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$conn = null;
try {
    /**
     * @section Database Connection
     * @description Establece la conexión a la base de datos Oracle.
     */
    // Construye la cadena DSN y establece la conexión a la base de datos Oracle en UTF-8.
    $connStr = oracle_dsn($DB_HOST, $DB_PORT, $DB_SERVICE_NAME);
    $conn = @oci_connect($DB_USERNAME, $DB_PASSWORD, $connStr, 'AL32UTF8');
    // Si la conexión falla, lanza una excepción.
    if (!$conn) {
        $e = oci_error();
        throw new Exception($e['message'] ?? 'Error de conexión OCI');
    }

    // Prepara la sentencia SQL INSERT para insertar un nuevo registro en SGU_USUARIO.
    // USR_FECHA_REG se establece automáticamente con la fecha y hora actual del sistema Oracle (SYSDATE).
    $sql = "INSERT INTO SGU_USUARIO (
        GRP_ID, PRS_ID, USR_NOMBRE, USR_CORREO, USR_TELEFONO,
        USR_ROL_ID, USR_ESTADO, USR_FECHA_REG
    ) VALUES (
        :grp_id, :prs_id, :nombre, :correo, :telefono,
        :rol_id, :estado, SYSDATE
    )";

    $stid = oci_parse($conn, $sql);

    // Vincula los parámetros de la sentencia SQL con las variables PHP.
    // Esto previene ataques de inyección SQL y asegura el tipo de dato correcto.
    oci_bind_by_name($stid, ":grp_id", $grp_id, -1, SQLT_INT);
    oci_bind_by_name($stid, ":prs_id", $prs_id, -1, SQLT_INT);
    oci_bind_by_name($stid, ":nombre", $nombre);
    oci_bind_by_name($stid, ":correo", $correo);
    oci_bind_by_name($stid, ":telefono", $telefono);
    oci_bind_by_name($stid, ":rol_id", $rol_id, -1, SQLT_INT);
    oci_bind_by_name($stid, ":estado", $usr_estado, -1, SQLT_INT);

    // Ejecuta la sentencia SQL. Si falla, lanza una excepción.
    if (!oci_execute($stid)) {
        $e = oci_error($stid);
        throw new Exception($e['message'] ?? 'Error al ejecutar el INSERT');
    }

    // Si la inserción es exitosa, devuelve una respuesta JSON de éxito.
    echo json_encode(['success' => true, 'message' => 'Usuario creado correctamente.']);

} catch (Throwable $e) {
    /**
     * @section Error Handling
     * @description Maneja cualquier excepción que ocurra durante la ejecución.
     */
    // Si ocurre un error, establece el código de respuesta HTTP a 500 y devuelve un JSON con el mensaje de error.
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
} finally {
    /**
     * @section Resource Cleanup
     * @description Libera los recursos de la base de datos.
     */
    // Asegura que el statement y la conexión a la base de datos se liberen, incluso si ocurre un error.
    if (isset($stid)) {
        oci_free_statement($stid);
    }
    if ($conn) {
        oci_close($conn);
    }
}
