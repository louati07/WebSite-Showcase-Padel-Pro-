<?php
require __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();


ini_set('display_errors', 0);
error_reporting(E_ALL);

set_exception_handler(function ($e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
});

set_error_handler(function ($severity, $msg, $file, $line) {
    throw new ErrorException($msg, 0, $severity, $file, $line);
});

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        $host = $_ENV['DB_HOST'];
        $db   = $_ENV['DB_NAME'] ;
        $user = $_ENV['DB_USER'] ;
        $pass = $_ENV['DB_PWD'] ;
        $port = $_ENV['DB_PORT'] ;
        $dsn  = "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4";
        $pdo  = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonError($message, $code = 400) {
    jsonResponse(['success' => false, 'error' => $message], $code);
}

function getPostData() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return $data ?: $_POST;
}
