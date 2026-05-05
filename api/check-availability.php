<?php
require_once __DIR__ . '/config.php';

$courtId = isset($_GET['court_id']) ? (int)$_GET['court_id'] : 0;
$date    = $_GET['date']  ?? '';
$start   = $_GET['start'] ?? '';
$end     = $_GET['end']   ?? '';

if (!$courtId || !$date || !$start || !$end) jsonError('Missing required parameters');

try {
    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT reservation_id FROM reservations WHERE court_id = ? AND booking_date = ? AND status != 'Cancelled' AND start_time < ? AND end_time > ?");
    $stmt->execute([$courtId, $date, $end, $start]);
    $overlap = $stmt->fetch();

    jsonResponse(['success' => true, 'available' => !$overlap]);
} catch (Exception $e) {
    jsonError('Availability check failed: ' . $e->getMessage(), 500);
}
