<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="latest-commit-sha" value="@@hash">
    <meta name="api-base-path" value=@@api_base_path>
    <meta name="pdf-api-base-path" value=@@pdf_api_base_path>
    <title>Prossimo App (current version: @@hash)</title>

    <link rel="shortcut icon" href="/static/public/img/@@favicon">

    <link rel="stylesheet" href="/static/public/css/vendor.@@hash.min.css" media="all">
    <link rel="stylesheet" href="/static/public/css/styles.@@hash.css" media="all">
    <link rel="stylesheet" href="/static/public/css/print.@@hash.css" media="print">

    <script src="/static/public/js/vendor.@@hash.min.js"></script>
    <script src="/static/public/js/templates.@@hash.js"></script>

    @@scripts
</head>
<body>
    <aside id="sidebar" class="sidebar"></aside>
    <header id="header" class="header"></header>
    <main id="main" class="main"></main>
    <div id="dialogs" class="dialog-container"></div>
</body>
</html>
