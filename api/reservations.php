<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);

$d = getPostData();
$firstName  = trim($d['first_name']   ?? '');
$lastName   = trim($d['last_name']    ?? '');
$email      = strtolower(trim($d['email'] ?? ''));
$phone      = trim($d['phone']       ?? '');
$courtId    = (int)($d['court_id']    ?? 0);
$bookDate   = $d['booking_date']      ?? '';
$startTime  = $d['start_time']        ?? '';
$endTime    = $d['end_time']          ?? '';
$promoCode  = trim($d['promo_code']   ?? '');

if (!$firstName || !$lastName || !$email || !$courtId || !$bookDate || !$startTime || !$endTime) {
    jsonError('All required fields must be filled');
}
if ($startTime >= $endTime) jsonError('End time must be after start time');

try {
    $pdo = getDB();
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("SELECT client_id FROM clients WHERE email = ?");
    $stmt->execute([$email]);
    $client = $stmt->fetch();

    if ($client) {
        $clientId = (int)$client['client_id'];
    } else {
        $stmt = $pdo->prepare("INSERT INTO clients (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)");
        $stmt->execute([$firstName, $lastName, $email, $phone ?: null]);
        $clientId = (int)$pdo->lastInsertId();
    }

    $stmt = $pdo->prepare("SELECT reservation_id FROM reservations WHERE court_id = ? AND booking_date = ? AND status != 'Cancelled' AND start_time < ? AND end_time > ?");
    $stmt->execute([$courtId, $bookDate, $endTime, $startTime]);
    if ($stmt->fetch()) {
        $pdo->rollBack();
        jsonError('This court is already booked for that time slot');
    }

    $promoId = null;
    $discountPercent = 0.0;

    if ($promoCode) {
        $stmt = $pdo->prepare("SELECT promo_id, discount_percent, winner_email FROM promo_codes WHERE code = ? AND is_used = 0");
        $stmt->execute([$promoCode]);
        $promo = $stmt->fetch();

        if (!$promo) {
            $pdo->rollBack();
            jsonError('Invalid or already used promo code');
        }
        if (strtolower($promo['winner_email']) !== $email) {
            $pdo->rollBack();
            jsonError('This promo code does not belong to your account');
        }
        $promoId = (int)$promo['promo_id'];
        $discountPercent = (float)$promo['discount_percent'];
    }

    $stmt = $pdo->prepare("SELECT hourly_rate FROM courts WHERE court_id = ? AND is_active = 1");
    $stmt->execute([$courtId]);
    $court = $stmt->fetch();
    if (!$court) {
        $pdo->rollBack();
        jsonError('Court not found or inactive');
    }
    $hourlyRate = (float)$court['hourly_rate'];

    $s = explode(':', $startTime);
    $e = explode(':', $endTime);
    $duration = (((int)$e[0]*60 + (int)$e[1]) - ((int)$s[0]*60 + (int)$s[1])) / 60;

    $basePrice  = $duration * $hourlyRate;
    $discount   = $basePrice * ($discountPercent / 100);
    $finalPrice = round($basePrice - $discount, 2);

    $stmt = $pdo->prepare("INSERT INTO reservations (client_id, court_id, promo_id, booking_date, start_time, end_time, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')");
    $stmt->execute([$clientId, $courtId, $promoId, $bookDate, $startTime, $endTime, $finalPrice]);
    $reservationId = (int)$pdo->lastInsertId();

    if ($promoId) {
        $stmt = $pdo->prepare("UPDATE promo_codes SET is_used = 1 WHERE promo_id = ?");
        $stmt->execute([$promoId]);
    }

    $pdo->commit();

    $stmt = $pdo->prepare("SELECT name FROM courts WHERE court_id = ?");
    $stmt->execute([$courtId]);
    $courtName = $stmt->fetch()['name'];

    jsonResponse([
        'success'        => true,
        'reservation_id' => $reservationId,
        'summary'        => [
            'court'      => $courtName,
            'date'       => $bookDate,
            'start'      => $startTime,
            'end'        => $endTime,
            'duration'   => round($duration, 1),
            'rate'       => $hourlyRate,
            'discount'   => $discountPercent,
            'total'      => $finalPrice
        ],
        'message' => "Reservation confirmed! {$duration}h × {$hourlyRate} TND/h" .
                     ($discountPercent ? " − {$discountPercent}% promo" : '') .
                     " = TND{$finalPrice}"
    ], 201);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    jsonError('Reservation failed: ' . $e->getMessage(), 500);
}
