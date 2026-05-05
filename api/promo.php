<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);

$data = getPostData();
$code  = trim($data['code']  ?? '');
$email = strtolower(trim($data['email'] ?? ''));

if (!$code || !$email) jsonError('Code and email are required');

try {
    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT promo_id, discount_percent, winner_email FROM promo_codes WHERE code = ? AND is_used = 0");
    $stmt->execute([$code]);
    $promo = $stmt->fetch();

    if (!$promo) jsonResponse(['success' => true, 'valid' => false, 'message' => 'Invalid or already used promo code']);
    if (strtolower($promo['winner_email']) !== $email) jsonResponse(['success' => true, 'valid' => false, 'message' => 'This promo code does not belong to your email']);

    jsonResponse([
        'success'          => true,
        'valid'            => true,
        'promo_id'         => (int)$promo['promo_id'],
        'discount_percent' => (float)$promo['discount_percent'],
        'message'          => 'Promo code valid! ' . $promo['discount_percent'] . '% discount'
    ]);
} catch (Exception $e) {
    jsonError('Promo validation failed: ' . $e->getMessage(), 500);
}
