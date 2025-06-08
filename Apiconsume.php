<?php
session_start();

// Function to make a POST request to the API
function makePostRequest($url, $data, $token = null) {
    $ch = curl_init();

    $headers = ['Content-Type: application/json'];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }

    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => $headers
    ]);

    $response = curl_exec($ch);

    if (curl_errno($ch)) {
        echo 'cURL error: ' . curl_error($ch);
    }

    curl_close($ch);
    return json_decode($response, true);
}

// Function to make a GET request with Bearer Token
function makeGetRequest($url, $token) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $token
        ]
    ]);

    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true);
}

// Handle login
if (isset($_POST['login_email'], $_POST['login_password'])) {
    $data = [
        'email' => $_POST['login_email'],
        'password' => $_POST['login_password']
    ];

    $response = makePostRequest("https://apiwork-9gin.onrender.com/login", $data);

    if (isset($response['token'])) {
        $_SESSION['token'] = $response['token'];
        echo "<p>✅ Login successful.</p>";
    } else {
        echo "<p>❌ Login failed: " . htmlspecialchars($response['message'] ?? 'Unknown error') . "</p>";
    }
}

// Handle signup
if (isset($_POST['signup_email'], $_POST['signup_password'], $_POST['signup_confirm_password'])) {
    if ($_POST['signup_password'] !== $_POST['signup_confirm_password']) {
        echo "<p>❌ Passwords do not match.</p>";
    } else {
        $data = [
            'username' => explode('@', $_POST['signup_email'])[0],
            'email' => $_POST['signup_email'],
            'password' => $_POST['signup_password']
        ];

        $response = makePostRequest("https://apiwork-9gin.onrender.com/signup", $data);

        if (isset($response['message']) && strpos($response['message'], 'success') !== false) {
            echo "<p>✅ Signup successful. You can now log in.</p>";
        } else {
            echo "<p>❌ Signup failed: " . htmlspecialchars($response['message'] ?? 'Unknown error') . "</p>";
        }
    }
}

// Handle product retrieval
if (isset($_POST['view_products'])) {
    if (!isset($_SESSION['token'])) {
        echo "<p>⚠️ Please login to view products.</p>";
    } else {
        $response = makeGetRequest("https://apiwork-9gin.onrender.com/products", $_SESSION['token']);

        if (is_array($response)) {
            echo "<h2>🛒 Product List</h2>";
            echo "<table border='1' cellpadding='10'>
                    <tr><th>Name</th><th>Description</th><th>Price</th><th>Stock</th></tr>";
            foreach ($response as $product) {
                echo "<tr>
                        <td>" . htmlspecialchars($product['product_name']) . "</td>
                        <td>" . htmlspecialchars($product['description']) . "</td>
                        <td>$" . htmlspecialchars($product['price']) . "</td>
                        <td>" . htmlspecialchars($product['stock']) . "</td>
                      </tr>";
            }
            echo "</table>";
        } else {
            echo "<p>❌ Failed to retrieve products.</p>";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>PHP Frontend | Login, Signup, Products</title>
    <style>
        body {
            font-family: Arial;
            background: #f0f0f0;
            padding: 30px;
        }
        form {
            background: #fff;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px #ccc;
        }
        input[type=email], input[type=password] {
            padding: 10px;
            margin: 5px 0 15px;
            width: 100%;
            border-radius: 4px;
            border: 1px solid #ccc;
        }
        button {
            padding: 10px 20px;
            background: #0077cc;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        table {
            background: #fff;
            border-collapse: collapse;
            margin-top: 20px;
        }
        table th, table td {
            padding: 10px;
        }
    </style>
</head>
<body>
    <h1>🌐 PHP + API Frontend</h1>

    <!-- Login Form -->
    <h2>Login</h2>
    <form method="POST">
        <input type="email" name="login_email" placeholder="Email" required>
        <input type="password" name="login_password" placeholder="Password" required>
        <button type="submit">Login</button>
    </form>

    <!-- Signup Form -->
    <h2>Signup</h2>
    <form method="POST">
        <input type="email" name="signup_email" placeholder="Email" required>
        <input type="password" name="signup_password" placeholder="Password" required>
        <input type="password" name="signup_confirm_password" placeholder="Confirm Password" required>
        <button type="submit">Signup</button>
    </form>

    <!-- View Products Button -->
    <h2>View Products</h2>
    <form method="POST">
        <button type="submit" name="view_products">Get Products</button>
    </form>
</body>
</html>
