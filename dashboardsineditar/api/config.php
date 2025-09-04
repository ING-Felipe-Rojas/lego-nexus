<?php
/**
 * Configuración de base de datos Oracle (OCI8)
 *
 * Importante:
 * - En producción, evita dejar credenciales en texto plano. Prefiere
 *   variables de entorno o un gestor de secretos.
 * - Asegúrate de tener instalado Oracle Instant Client y habilitada la
 *   extensión OCI8 en PHP.
 */

// Credenciales y parámetros de conexión
$DB_USERNAME = "orades2";
$DB_PASSWORD = "SxK3yPAqj3ZA";
$DB_HOST = "humbdev.unap.cl";
$DB_PORT = "1521";
$DB_SERVICE_NAME = "humbdev.unap.cl";

/**
 *
 * @param string $host Host o IP del servidor Oracle
 * @param string|int $port Puerto del listener (por defecto 1521)
 * @param string $serviceName SERVICE_NAME de la BD
 * @return string Cadena de conexión para oci_connect
 */
function oracle_dsn($host, $port, $serviceName) {
    return "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST={$host})(PORT={$port}))(CONNECT_DATA=(SERVICE_NAME={$serviceName})))";
}
