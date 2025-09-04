<?php
/**
 * API: Listado de SGU_USUARIO en Oracle (JSON)
 *
 * Método: GET
 * Parámetros:
 *  - op (opcional, string): Operación a realizar. 'list' (por defecto) o 'search'.
 *  - limit (opcional, int): cantidad máxima de filas a traer (1..1000). Por defecto 100.
 *  - query (opcional, string): Término de búsqueda para la operación 'search'.
 *
 * Respuesta (200):
 *  {
 *    "success": true,
 *    "count": <número de filas>,
 *    "columns": ["COL1", "COL2", ...],
 *    "rows": [ { "COL1": "valor", ... }, ... ]
 *  }
 *
 * Errores (500):
 *  {
 *    "success": false,
 *    "error": "Mensaje descriptivo"
 *  }
 */

header('Content-Type: application/json; charset=utf-8');
// CORS básico (ajusta o restringe según tu despliegue)
header('Access-Control-Allow-Origin: *');

require __DIR__ . '/config.php';

// Sanitiza y limita el parámetro "limit"
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
if ($limit <= 0) { $limit = 100; }
if ($limit > 1000) { $limit = 1000; }

// Get the operation parameter
$op = isset($_GET['op']) ? $_GET['op'] : 'list'; // Default operation is 'list'

// Verifica que la extensión OCI8 esté disponible
if (!function_exists('oci_connect')) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'La extensión OCI8 de PHP no está habilitada. Instálala/habilítala para conectar a Oracle.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Construye el DSN y abre conexión en UTF-8
    $connStr = oracle_dsn($DB_HOST, $DB_PORT, $DB_SERVICE_NAME);
    $conn = @oci_connect($DB_USERNAME, $DB_PASSWORD, $connStr, 'AL32UTF8');
    if (!$conn) {
        $e = oci_error();
        throw new Exception($e['message'] ?? 'Error de conexión OCI');
    }

    $sql = "";
    $stid = null;

    if ($op === 'search') {
        $search_query = isset($_GET['query']) ? trim($_GET['query']) : '';

        if (empty($search_query)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'El parámetro "query" es requerido para la operación de búsqueda.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Construct the search SQL query using the correct column names
        // Using UPPER for case-insensitive search and CONCAT for wildcards
        $sql = "SELECT * FROM SGU_USUARIO WHERE (UPPER(USR_NOMBRE) LIKE UPPER(:search_term) OR UPPER(USR_CORREO) LIKE UPPER(:search_term)) AND ROWNUM <= :lim";
        $stid = oci_parse($conn, $sql);

        $search_term_param = '%' . $search_query . '%';
        oci_bind_by_name($stid, ":search_term", $search_term_param);
        oci_bind_by_name($stid, ":lim", $limit, -1, SQLT_INT);

    } else { // Default operation or 'list'
        $sql = "SELECT * FROM SGU_USUARIO WHERE ROWNUM <= :lim";
        $stid = oci_parse($conn, $sql);
        oci_bind_by_name($stid, ":lim", $limit, -1, SQLT_INT);
    }

    // Ejecuta la consulta
    if (!oci_execute($stid)) {
        $e = oci_error($stid);
        throw new Exception($e['message'] ?? 'Error al ejecutar la consulta');
    }

    // Recorre filas y normaliza claves a mayúsculas
    $rows = [];
    while (($row = oci_fetch_array($stid, OCI_ASSOC + OCI_RETURN_NULLS)) != false) {
        $normalized = [];
        foreach ($row as $key => $value) {
            $normalized[strtoupper($key)] = $value;
        }
        $rows[] = $normalized;
    }

    // Deriva listado de columnas a partir de la primera fila (si existe)
    $columns = [];
    if (!empty($rows)) {
        $columns = array_keys($rows[0]);
    }

    // Respuesta JSON
    echo json_encode([
        'success' => true,
        'count' => count($rows),
        'columns' => $columns,
        'rows' => $rows
    ], JSON_UNESCAPED_UNICODE);

    // Limpieza de recursos
    oci_free_statement($stid);
    oci_close($conn);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
