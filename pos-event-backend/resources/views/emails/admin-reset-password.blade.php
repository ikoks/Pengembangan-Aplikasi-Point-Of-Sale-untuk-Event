<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Password</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        .container {
            background-color: #ffffff;
            max-width: 600px;
            margin: 0 auto;
            padding: 30px;
            border-top: 5px solid #0A0A0A;
            border: 2px solid #0A0A0A;
            box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
        }
        .header {
            font-size: 24px;
            font-weight: bold;
            color: #0A0A0A;
            margin-bottom: 20px;
            text-align: center;
        }
        .content {
            font-size: 16px;
            color: #333333;
            line-height: 1.5;
        }
        .btn {
            display: block;
            width: 250px;
            margin: 30px auto;
            padding: 15px;
            text-align: center;
            background-color: #0A0A0A;
            color: #ffffff;
            text-decoration: none;
            font-weight: bold;
            font-size: 16px;
            border: 2px solid #0A0A0A;
            box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777777;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            POS EVENT
        </div>
        <div class="content">
            <p>Halo, <strong>{{ $user->nama_user }}</strong>!</p>
            <p>Kami menerima permintaan untuk mereset password akun Admin Anda di sistem POS Event.</p>
            <p>Silakan klik tombol di bawah ini untuk membuat password baru. Tautan ini hanya berlaku selama <strong>60 menit</strong>.</p>
            
            <a href="{{ $resetUrl }}" class="btn">RESET PASSWORD</a>
            
            <p>Jika Anda tidak meminta reset password, abaikan email ini. Akun Anda tetap aman.</p>
            <br>
            <p>Jika tombol di atas tidak berfungsi, copy-paste URL berikut ke browser Anda:</p>
            <p style="word-break: break-all; color: #0A0A0A;">
                <a href="{{ $resetUrl }}">{{ $resetUrl }}</a>
            </p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} POS Event System. All rights reserved.
        </div>
    </div>
</body>
</html>
