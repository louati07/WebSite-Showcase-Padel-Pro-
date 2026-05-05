<?php
require_once __DIR__ . '/config.php';

try {
    $pdo = getDB();
    $stmt = $pdo->query("SELECT court_id, name, surface_type, hourly_rate FROM courts WHERE is_active = 1 ORDER BY court_id");
    $courts = $stmt->fetchAll();

    foreach ($courts as &$c) {
        $c['hourly_rate'] = (float)$c['hourly_rate'];
        $c['court_id']    = (int)$c['court_id'];
    }

    jsonResponse(['success' => true, 'data' => $courts]);
} catch (Exception $e) {
    jsonError('Failed to load courts: ' . $e->getMessage(), 500);
}
