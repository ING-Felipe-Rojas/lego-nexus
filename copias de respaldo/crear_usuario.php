<?php
// api/crear_usuario.php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // Ajusta en producción
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require __DIR__ . '/config.php';

// Solo permitir método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['success' => false, 'error' => 'Método no permitido.']);
    exit;
}

// Obtener el cuerpo de la solicitud
//$input = json_decode(file_get_contents('php://input'), true);

// --- Validación básica de datos ---
//if (empty($input['name']) || empty($input['email']) || empty($input['role'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'Faltan datos requeridos: nombre, email y rol.']);
    exit;
}

// --- Mapeo de datos y valores por defecto ---
$nombre = $input['name'];
$correo = $input['email'];
$telefono = $input['phone'] ?? null; // Opcional

// Mapeo de rol (texto) a USR_ROL_ID (número)
// ¡Ajusta estos IDs a los que correspondan en tu base de datos!
$rol_map = [
    'alumnos' => 1,
    'funcionarios' => 2,
    'externos' => 3,
];
$rol_id = $rol_map[$input['role']] ?? null;

//if ($rol_id === null) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'El rol proporcionado no es válido.']);
    exit;
}

// Valores fijos o por defecto para campos NOT NULL no presentes en el formulario
$grp_id = 1; // Asumido, ajustar si es necesario
$prs_id = 1; // Asumido, ajustar si es necesario
$usr_estado = 1; // Por defecto activo

// --- Lógica de Base de Datos ---

// Verifica que la extensión OCI8 esté disponible
if (!function_exists('oci_connect')) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'La extensión OCI8 de PHP no está habilitada.']);
    exit;
}

$conn = null;
try {
    // Conexión a la BD (reutilizando la lógica de usuarios.php)
    $connStr = oracle_dsn($DB_HOST, $DB_PORT, $DB_SERVICE_NAME);
    $conn = @oci_connect($DB_USERNAME, $DB_PASSWORD, $connStr, 'AL32UTF8');
    if (!$conn) {
        $e = oci_error();
        throw new Exception($e['message'] ?? 'Error de conexión OCI');
    }

    // Sentencia INSERT
    // USR_FECHA_REG se inserta con SYSDATE
    $sql = "INSERT INTO SGU_USUARIO (
                GRP_ID, PRS_ID, USR_NOMBRE, USR_CORREO, USR_TELEFONO,
                USR_ROL_ID, USR_ESTADO, USR_FECHA_REG
            ) VALUES (
                :grp_id, :prs_id, :nombre, :correo, :telefono,
                :rol_id, :estado, SYSDATE
            )";

    $stid = oci_parse($conn, $sql);

    // Bindeo de parámetros para seguridad (previene inyección SQL)
    oci_bind_by_name($stid, ":grp_id", $grp_id, -1, SQLT_INT);
    oci_bind_by_name($stid, ":prs_id", $prs_id, -1, SQLT_INT);
    oci_bind_by_name($stid, ":nombre", $nombre);
    oci_bind_by_name($stid, ":correo", $correo);
    oci_bind_by_name($stid, ":telefono", $telefono);
    oci_bind_by_name($stid, ":rol_id", $rol_id, -1, SQLT_INT);
    oci_bind_by_name($stid, ":estado", $usr_estado, -1, SQLT_INT);

    // Ejecutar la consulta (en modo auto-commit por defecto)
    if (!oci_execute($stid)) {
        $e = oci_error($stid);
        throw new Exception($e['message'] ?? 'Error al ejecutar el INSERT');
    }

    // Respuesta de éxito
    echo json_encode(['success' => true, 'message' => 'Usuario creado correctamente.']);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
} finally {
    // Limpieza de recursos
    if (isset($stid)) {
        oci_free_statement($stid);
    }
    if ($conn) {
        oci_close($conn);
    }
}
