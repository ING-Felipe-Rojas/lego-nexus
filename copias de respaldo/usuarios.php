<?php
/**
 * API: Listado de SGU_USUARIO en Oracle (JSON)
 *
 * Método: GET
 * Parámetros:
 *  - limit (opcional, int): cantidad máxima de filas a traer (1..1000). Por defecto 100.
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
//if ($limit <= 0) { $limit = 100; }
if ($limit > 1000) { $limit = 1000; }

// Verifica que la extensión OCI8 esté disponible
//if (!function_exists('oci_connect')) {
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

    // Consulta genérica. Si necesitas campos específicos, reemplaza el SELECT *
    // Uso de ROWNUM para compatibilidad amplia con distintas versiones de Oracle
    $sql = "SELECT * FROM SGU_USUARIO WHERE ROWNUM <= :lim";
    $stid = oci_parse($conn, $sql);
    oci_bind_by_name($stid, ":lim", $limit, -1, SQLT_INT);

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
}\
