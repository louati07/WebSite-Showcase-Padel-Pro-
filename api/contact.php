<?php
require_once __DIR__ . '/config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);

$d = getPostData();
$name    = trim($d['name']    ?? '');
$email   = trim($d['email']   ?? '');
$subject = trim($d['subject'] ?? '');
$message = trim($d['message'] ?? '');

if (!$name || !$email || !$subject || !$message) jsonError('All fields are required');
if (!filter_var($email, FILTER_VALIDATE_EMAIL))  jsonError('Invalid email address');
if (strlen($message) < 10)                       jsonError('Message too short (min 10 chars)');

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = $_ENV['SMTP_HOST'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $_ENV['SMTP_USER'];
    $mail->Password   = $_ENV['SMTP_PWD'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = (int) $_ENV['SMTP_PORT'];

    $mail->setFrom($_ENV['SMTP_USER'], "$name via " . $_ENV['SMTP_FROM_NAME']);
    $mail->addAddress($_ENV['SMTP_TO']);
    $mail->addReplyTo($email, $name);

    $mail->isHTML(true);
    $mail->Subject = "[PadelPro Contact] $subject";
    $mail->Body    = buildEmailBody($name, $email, $subject, $message);
    $mail->AltBody = "From: $name ($email)\nSubject: $subject\n\n$message";

    $mail->send();

    jsonResponse([
        'success' => true,
        'message' => 'Thank you for your message! We will get back to you within 24 hours.'
    ]);
} catch (Exception $e) {
    jsonError('Failed to send message. Please try again later.', 500);
}

function buildEmailBody($name, $email, $subject, $message) {
    $message = nl2br(htmlspecialchars($message));
    $name    = htmlspecialchars($name);
    $email   = htmlspecialchars($email);
    $subject = htmlspecialchars($subject);
    $date    = date('F j, Y \a\t g:i A');

    return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#0a0a0f;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#16161f;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#16161f,#1c1c28);padding:32px 40px;border-bottom:2px solid #c8ff00;">
                            <h1 style="margin:0;font-size:24px;color:#f0f0f0;font-weight:700;">
                                PADEL<span style="color:#c8ff00;">PRO</span>
                            </h1>
                            <p style="margin:8px 0 0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#c8ff00;">
                                New Contact Message
                            </p>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding:32px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding:12px 16px;background:#111118;border-radius:10px;margin-bottom:16px;">
                                        <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#6b6b7a;">From</p>
                                        <p style="margin:0;font-size:16px;color:#f0f0f0;font-weight:600;">$name</p>
                                        <p style="margin:4px 0 0;font-size:14px;color:#c8ff00;">
                                            <a href="mailto:$email" style="color:#c8ff00;text-decoration:none;">$email</a>
                                        </p>
                                    </td>
                                </tr>
                                <tr><td style="height:16px;"></td></tr>
                                <tr>
                                    <td style="padding:12px 16px;background:#111118;border-radius:10px;">
                                        <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#6b6b7a;">Subject</p>
                                        <p style="margin:0;font-size:16px;color:#f0f0f0;font-weight:600;">$subject</p>
                                    </td>
                                </tr>
                                <tr><td style="height:16px;"></td></tr>
                                <tr>
                                    <td style="padding:16px;background:#111118;border-radius:10px;">
                                        <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#6b6b7a;">Message</p>
                                        <p style="margin:0;font-size:15px;color:#a0a0b0;line-height:1.7;">$message</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding:20px 40px;background:#111118;border-top:1px solid rgba(255,255,255,0.06);">
                            <p style="margin:0;font-size:12px;color:#6b6b7a;">
                                Sent on $date &middot; You can reply directly to this email to respond to the sender.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
}
