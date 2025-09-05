<?php
session_start();

header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/config.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'error' => 'Usuario no autenticado.']);
    exit;
}

$user_id = $_SESSION['user_id'];

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

    $sql = "SELECT USR_NOMBRE, USR_CORREO, USR_TELEFONO FROM SGU_USUARIO WHERE USR_ID = :user_id";

    $stid = oci_parse($conn, $sql);
    if (!$stid) {
        $e = oci_error($conn);
        throw new Exception($e['message'] ?? 'Error al preparar la consulta.');
    }

    oci_bind_by_name($stid, ':user_id', $user_id, -1, SQLT_INT);

    if (!oci_execute($stid)) {
        $e = oci_error($stid);
        throw new Exception($e['message'] ?? 'Error al ejecutar la consulta.');
    }

    $user_data = oci_fetch_array($stid, OCI_ASSOC + OCI_RETURN_NULLS);

    if ($user_data) {
        echo json_encode(['success' => true, 'data' => $user_data]);
    } else {
        http_response_code(404); // Not Found
        echo json_encode(['success' => false, 'error' => 'Usuario no encontrado.']);
    }

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
} finally {
    if ($stid) {
        oci_free_statement($stid);
    }
    if ($conn) {
        oci_close($conn);
    }
}
?>