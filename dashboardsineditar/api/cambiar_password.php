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

if (!$data || empty($data['currentPassword']) || empty($data['newPassword']) || empty($data['confirmPassword'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Todos los campos son requeridos.']);
    exit;
}

if ($data['newPassword'] !== $data['confirmPassword']) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'La nueva contraseña y la confirmación no coinciden.']);
    exit;
}

$currentPassword = $data['currentPassword'];
$newPassword = $data['newPassword'];

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

    // 1. Fetch current password from DB
    $sql_select = "SELECT USR_PASSWORD FROM SGU_USUARIO WHERE USR_ID = :user_id";
    $stid_select = oci_parse($conn, $sql_select);
    oci_bind_by_name($stid_select, ':user_id', $user_id, -1, SQLT_INT);
    oci_execute($stid_select);
    $user = oci_fetch_array($stid_select, OCI_ASSOC);

    if (!$user) {
        http_response_code(404);
        throw new Exception('Usuario no encontrado.');
    }

    // 2. Verify current password (direct string comparison for plain text passwords)
    if ($currentPassword !== $user['USR_PASSWORD']) {
        http_response_code(400);
        throw new Exception('La contraseña actual es incorrecta.');
    }

    // 3. Update the password in the database (storing as plain text)
    $sql_update = "UPDATE SGU_USUARIO SET USR_PASSWORD = :new_password WHERE USR_ID = :user_id";
    $stid_update = oci_parse($conn, $sql_update);
    oci_bind_by_name($stid_update, ':new_password', $newPassword);
    oci_bind_by_name($stid_update, ':user_id', $user_id, -1, SQLT_INT);
    
    $result = oci_execute($stid_update, OCI_COMMIT_ON_SUCCESS);
    if (!$result) {
        $e = oci_error($stid_update);
        throw new Exception($e['message'] ?? 'Error al actualizar la contraseña.');
    }

    echo json_encode(['success' => true, 'message' => 'Contraseña actualizada correctamente.']);

} catch (Throwable $e) {
    // Use the specific HTTP code we might have set before
    if (http_response_code() === 200) {
        http_response_code(500);
    }
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
} finally {
    if (isset($stid_select)) {
        oci_free_statement($stid_select);
    }
    if (isset($stid_update)) {
        oci_free_statement($stid_update);
    }
    if ($conn) {
        oci_close($conn);
    }
}
?>