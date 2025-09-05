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

// Get and Decode Input
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

if (!$data || empty($data['name']) || empty($data['email'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Datos incompletos.']);
    exit;
}

$name = $data['name'];
$email = $data['email'];
$phone = $data['phone'] ?? ''; // Phone is optional

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

    $sql = "UPDATE SGU_USUARIO SET USR_NOMBRE = :name, USR_CORREO = :email, USR_TELEFONO = :phone WHERE USR_ID = :user_id";

    $stid = oci_parse($conn, $sql);
    if (!$stid) {
        $e = oci_error($conn);
        throw new Exception($e['message'] ?? 'Error al preparar la consulta de actualización.');
    }

    // Bind parameters
    oci_bind_by_name($stid, ':name', $name);
    oci_bind_by_name($stid, ':email', $email);
    oci_bind_by_name($stid, ':phone', $phone);
    oci_bind_by_name($stid, ':user_id', $user_id, -1, SQLT_INT);

    $result = oci_execute($stid, OCI_COMMIT_ON_SUCCESS);
    if (!$result) {
        $e = oci_error($stid);
        throw new Exception($e['message'] ?? 'Error al ejecutar la actualización.');
    }

    echo json_encode(['success' => true, 'message' => 'Perfil actualizado correctamente.']);

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