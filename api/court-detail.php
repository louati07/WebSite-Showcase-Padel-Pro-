<?php
require_once __DIR__ . '/config.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) jsonError('Missing or invalid court ID');

try {
    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT court_id, name, surface_type, hourly_rate FROM courts WHERE court_id = ? AND is_active = 1");
    $stmt->execute([$id]);
    $court = $stmt->fetch();

    if (!$court) jsonError('Court not found', 404);

    $court['hourly_rate'] = (float)$court['hourly_rate'];
    $court['court_id']    = (int)$court['court_id'];

    $stmt2 = $pdo->prepare("SELECT booking_date, start_time, end_time, status FROM reservations WHERE court_id = ? AND booking_date >= CURDATE() AND status != 'Cancelled' ORDER BY booking_date, start_time LIMIT 20");
    $stmt2->execute([$id]);
    $bookings = $stmt2->fetchAll();

    jsonResponse(['success' => true, 'data' => $court, 'upcoming_bookings' => $bookings]);
} catch (Exception $e) {
    jsonError('Failed to load court details: ' . $e->getMessage(), 500);
}
