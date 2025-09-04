<?php
/**
 * API: Listado y Búsqueda de SGU_USUARIO en Oracle (JSON)
 *
 * Este script PHP proporciona una API para consultar la tabla `SGU_USUARIO` en una base de datos Oracle.
 * Permite listar todos los usuarios, buscar por nombre o correo, y filtrar por rol.
 *
 * Método: GET
 * Parámetros (URL Query Parameters):
 *  - limit (opcional, int): Cantidad máxima de filas a traer (rango: 1 a 1000). Por defecto 100.
 *  - op (opcional, string): Tipo de operación a realizar. Puede ser:
 *      - 'list' (por defecto): Lista usuarios sin filtros adicionales (aparte del límite).
 *      - 'search': Realiza una búsqueda por `query`.
 *  - query (opcional, string): Término de búsqueda. Requerido si `op` es 'search'. Busca en `USR_NOMBRE` y `USR_CORREO`.
 *  - role_id (opcional, int): ID numérico del rol para filtrar usuarios. Utilizado cuando `op` no es 'search'.
 *                             (Ej: 1 para alumnos, 2 para funcionarios, 3 para externos).
 *
 * Respuesta (200 OK - JSON):
 *  {
 *    "success": true,
 *    "count": <número de filas encontradas>,
 *    "columns": ["COL1", "COL2", ...], // Nombres de las columnas de la tabla SGU_USUARIO
 *    "rows": [ { "COL1": "valor", ... }, ... ] // Array de objetos, cada uno representando una fila de usuario
 *  }
 *
 * Errores (400 Bad Request, 500 Internal Server Error - JSON):
 *  {
 *    "success": false,
 *    "error": "Mensaje descriptivo del error."
 *  }
 */

// Establece el tipo de contenido de la respuesta como JSON y la codificación UTF-8.
header('Content-Type: application/json; charset=utf-8');
// Permite solicitudes desde cualquier origen (CORS). Ajustar en un entorno de producción para mayor seguridad.
header('Access-Control-Allow-Origin: *');

// Incluye el archivo de configuración de la base de datos.
require __DIR__ . '/config.php';

/**
 * @section Request Parameters Processing
 * @description Procesa y sanitiza los parámetros de la solicitud GET.
 */
// Sanitiza y limita el parámetro "limit" para controlar la cantidad de resultados.
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
if ($limit <= 0) { $limit = 100; }
if ($limit > 1000) { $limit = 1000; }

// Obtiene el parámetro de operación, por defecto es 'list'.
$op = isset($_GET['op']) ? $_GET['op'] : 'list';

// Obtiene el parámetro role_id, si está presente, lo convierte a entero.
$role_id = isset($_GET['role_id']) ? (int)$_GET['role_id'] : null;

/**
 * @section OCI8 Extension Check
 * @description Verifica la disponibilidad de la extensión OCI8 de PHP.
 */
// Comprueba si la extensión OCI8 de PHP está habilitada, es esencial para la conexión a Oracle.
if (!function_exists('oci_connect')) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'La extensión OCI8 de PHP no está habilitada. Instálala/habilítala para conectar a Oracle.'
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
    // Si la conexión falla, se captura el error y se lanza una excepción.
    if (!$conn) {
        $e = oci_error();
        throw new Exception($e['message'] ?? 'Error de conexión OCI');
    }

    /**
     * @section SQL Query Construction
     * @description Construye dinámicamente la consulta SQL basada en los parámetros de la solicitud.
     */
    $sql = "SELECT * FROM SGU_USUARIO WHERE 1=1"; // Consulta base, 1=1 permite añadir condiciones fácilmente.
    $bind_params = []; // Array para almacenar los parámetros a vincular.

    // Lógica para la operación de búsqueda.
    if ($op === 'search') {
        $search_query = isset($_GET['query']) ? trim($_GET['query']) : '';

        // Si la operación es búsqueda pero no se proporciona un término, devuelve un error 400.
        if (empty($search_query)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'El parámetro "query" es requerido para la operación de búsqueda.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Añade condiciones de búsqueda por nombre y correo (case-insensitive) a la consulta SQL.
        $sql .= " AND (UPPER(USR_NOMBRE) LIKE UPPER(:search_term) OR UPPER(USR_CORREO) LIKE UPPER(:search_term))";
        $search_term_param = '%' . $search_query . '%';
        $bind_params[':search_term'] = $search_term_param;

    // Lógica para el filtro por rol (si no es una operación de búsqueda).
    } else if ($role_id !== null) {
        // Añade la condición de filtro por USR_ROL_ID a la consulta SQL.
        $sql .= " AND USR_ROL_ID = :role_id";
        $bind_params[':role_id'] = $role_id;
    }

    // Añade el límite de filas a la consulta SQL.
    $sql .= " AND ROWNUM <= :lim";
    $bind_params[':lim'] = $limit;

    // Prepara la sentencia SQL para su ejecución.
    $stid = oci_parse($conn, $sql);

    /**
     * @section Parameter Binding
     * @description Vincula los parámetros a la sentencia SQL para prevenir inyección SQL.
     */
    // Vincula todos los parámetros definidos en $bind_params a la sentencia preparada.
    foreach ($bind_params as $key => $value) {
        // Determina el tipo de dato para el bindeo (entero para :lim y :role_id).
        if ($key === ':lim' || $key === ':role_id') {
            oci_bind_by_name($stid, $key, $bind_params[$key], -1, SQLT_INT);
        } else {
            oci_bind_by_name($stid, $key, $bind_params[$key]);
        }
    }

    /**
     * @section Query Execution
     * @description Ejecuta la consulta SQL preparada.
     */
    // Ejecuta la sentencia SQL. Si falla, se captura el error y se lanza una excepción.
    if (!oci_execute($stid)) {
        $e = oci_error($stid);
        throw new Exception($e['message'] ?? 'Error al ejecutar la consulta');
    }

    /**
     * @section Fetching and Normalizing Results
     * @description Recupera las filas de resultados y normaliza las claves a mayúsculas.
     */
    $rows = [];
    // Itera sobre los resultados, obteniendo cada fila como un array asociativo.
    while (($row = oci_fetch_array($stid, OCI_ASSOC + OCI_RETURN_NULLS)) != false) {
        $normalized = [];
        // Normaliza las claves de las columnas a mayúsculas para consistencia.
        foreach ($row as $key => $value) {
            $normalized[strtoupper($key)] = $value;
        }
        $rows[] = $normalized;
    }

    // Deriva los nombres de las columnas a partir de la primera fila (si existen resultados).
    $columns = [];
    if (!empty($rows)) {
        $columns = array_keys($rows[0]);
    }

    /**
     * @section JSON Response
     * @description Envía la respuesta JSON al cliente.
     */
    // Codifica los resultados (éxito, conteo, columnas, filas) en formato JSON y los imprime.
    echo json_encode([
        'success' => true,
        'count' => count($rows),
        'columns' => $columns,
        'rows' => $rows
    ], JSON_UNESCAPED_UNICODE);

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
