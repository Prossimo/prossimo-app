<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="latest-commit-sha" value="@@hash">
    <title>Prossimo App: Sign In</title>

    <link rel="stylesheet" href="/static/public/css/login.@@hash.css" media="all">
</head>
<body>
    <main id="main" class="main">
        <div class="login-box">
            <h4>Sign In to Prossimo App</h4>
            <form action="">
                <input id="pa_username" name="pa_username" type="text" class="form-control" placeholder="Username">
                <input id="pa_password" name="pa_password" type="password" class="form-control" placeholder="Password">
                <div class="error-container">
                    <p>Please provide correct username</p>
                </div>
                <button class="btn btn-login">Sign In</button>
            </form>
        </div>
    </main>
</body>
</html>
