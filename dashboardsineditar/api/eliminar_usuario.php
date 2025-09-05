<?php
/**
 * API: Eliminar un usuario de SGU_USUARIO
 *
 * Este script PHP maneja la eliminación de un registro de usuario en la tabla `SGU_USUARIO`.
 *
 * Método: POST
 * Content-Type: application/json
 *
 * Body (JSON):
 *  {
 *    "id": <ID del usuario a eliminar (int)>
 *  }
 *
 * Respuesta (200 OK - JSON):
 *  {
 *    "success": true,
 *    "message": "Usuario eliminado correctamente."
 *  }
 *
 * Errores (400, 404, 500 - JSON):
 *  {
 *    "success": false,
 *    "error": "Mensaje descriptivo del error."
 *  }
 */

// --- Headers ---
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// --- Includes ---
require __DIR__ . '/config.php';

// --- Get and Decode Input ---
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

// --- Validation ---
if (!$data || empty($data['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Datos JSON inválidos o ID de usuario ausente.']);
    exit;
}

$user_id = (int)$data['id'];

// --- Database Operation ---
$conn = null;
$stid = null;
try {
    if (!function_exists('oci_connect')) {
        throw new Exception('La extensión OCI8 de PHP no está habilitada.');
    }

    $connStr = oracle_dsn($DB_HOST, $DB_PORT, $DB_SERVICE_NAME);
    $conn = @oci_connect($DB_USERNAME, $DB_PASSWORD, $connStr, 'AL32UTF8');
    if (!$conn) {
        $e = oci_error();
        throw new Exception($e['message'] ?? 'Error de conexión OCI');
    }

    $sql = "DELETE FROM SGU_USUARIO WHERE USR_ID = :id";

    $stid = oci_parse($conn, $sql);
    if (!$stid) {
        $e = oci_error($conn);
        throw new Exception($e['message'] ?? 'Error al preparar la consulta de eliminación.');
    }

    // Bind parameter
    oci_bind_by_name($stid, ':id', $user_id, -1, SQLT_INT);

    $result = oci_execute($stid, OCI_COMMIT_ON_SUCCESS);
    if (!$result) {
        $e = oci_error($stid);
        throw new Exception($e['message'] ?? 'Error al ejecutar la eliminación.');
    }

    $rows_deleted = oci_num_rows($stid);
    if ($rows_deleted > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Usuario eliminado correctamente.'
        ]);
    } else {
        http_response_code(404); // Not Found
        echo json_encode([
            'success' => false,
            'error' => 'No se encontró ningún usuario con el ID proporcionado para eliminar.'
        ]);
    }

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
} finally {
    if ($stid) {
        oci_free_statement($stid);
    }
    if ($conn) {
        oci_close($conn);
    }
}
?>