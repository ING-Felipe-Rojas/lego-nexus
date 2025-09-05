<?php
/**
 * API: Actualizar un usuario en SGU_USUARIO
 *
 * Este script PHP maneja la actualización de un registro de usuario existente en la tabla `SGU_USUARIO`.
 *
 * Método: POST
 * Content-Type: application/json
 *
 * Body (JSON):
 *  {
 *    "id": <ID del usuario a actualizar (int)>,
 *    "name": "<Nuevo nombre del usuario (string)>",
 *    "email": "<Nuevo correo del usuario (string)>",
 *    "phone": "<Nuevo teléfono del usuario (string)>",
 *    "role": "<Nuevo rol del usuario (string, ej: 'alumnos')>"
 *  }
 *
 * Respuesta (200 OK - JSON):
 *  {
 *    "success": true,
 *    "message": "Usuario actualizado correctamente."
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
if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Datos JSON inválidos.']);
    exit;
}

$required_fields = ['id', 'name', 'email', 'phone', 'role'];
foreach ($required_fields as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => "El campo requerido '{$field}' está ausente."]);
        exit;
    }
}

// --- Role Name to ID Mapping ---
$roleIdMap = [
    'alumnos' => 1,
    'funcionarios' => 2,
    'externos' => 3
];
$role_name = strtolower($data['role']);
if (!isset($roleIdMap[$role_name])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Rol inválido especificado.']);
    exit;
}
$role_id = $roleIdMap[$role_name];

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

    $sql = "UPDATE SGU_USUARIO 
            SET 
                USR_NOMBRE = :name, 
                USR_CORREO = :email, 
                USR_TELEFONO = :phone, 
                USR_ROL_ID = :role_id 
            WHERE 
                USR_ID = :id";

    $stid = oci_parse($conn, $sql);
    if (!$stid) {
        $e = oci_error($conn);
        throw new Exception($e['message'] ?? 'Error al preparar la consulta de actualización.');
    }

    // Bind parameters
    oci_bind_by_name($stid, ':id', $data['id'], -1, SQLT_INT);
    oci_bind_by_name($stid, ':name', $data['name']);
    oci_bind_by_name($stid, ':email', $data['email']);
    oci_bind_by_name($stid, ':phone', $data['phone']);
    oci_bind_by_name($stid, ':role_id', $role_id, -1, SQLT_INT);

    $result = oci_execute($stid, OCI_COMMIT_ON_SUCCESS);
    if (!$result) {
        $e = oci_error($stid);
        throw new Exception($e['message'] ?? 'Error al ejecutar la actualización.');
    }

    $rows_updated = oci_num_rows($stid);
    if ($rows_updated > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Usuario actualizado correctamente.'
        ]);
    } else {
        http_response_code(404); // Not Found
        echo json_encode([
            'success' => false,
            'error' => 'No se encontró ningún usuario con el ID proporcionado.'
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