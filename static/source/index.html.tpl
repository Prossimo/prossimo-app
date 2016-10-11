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

    <link rel="stylesheet" href="/bower_components/blueimp-file-upload/css/jquery.fileupload.css">
    <link rel="stylesheet" href="/bower_components/blueimp-file-upload/css/jquery.fileupload-ui.css">
    <link rel="stylesheet" href="/bower_components/blueimp-file-upload/css/jquery.fileupload-noscript.css">
    <link rel="stylesheet" href="/bower_components/blueimp-file-upload/css/jquery.fileupload-ui-noscript.css">

    <script src="/static/public/js/vendor.@@hash.min.js"></script>
    <script src="/static/public/js/templates.@@hash.js"></script>

    @@scripts
</head>
<body>
    <aside id="sidebar" class="sidebar"></aside>
    <header id="header" class="header"></header>
    <main id="main" class="main"></main>
    <div id="dialogs" class="dialog-container"></div>

    <script src="/bower_components/blueimp-file-upload/js/vendor/jquery.ui.widget.js"></script>
    <script src="/bower_components/blueimp-load-image/js/load-image.all.min.js"></script>
    <script src="/bower_components/blueimp-canvas-to-blob/js/canvas-to-blob.min.js"></script>
    <script src="/bower_components/blueimp-file-upload/js/jquery.iframe-transport.js"></script>
    <script src="/bower_components/blueimp-file-upload/js/jquery.fileupload.js"></script>
    <script src="/bower_components/blueimp-file-upload/js/jquery.fileupload-process.js"></script>
    <script src="/bower_components/blueimp-file-upload/js/jquery.fileupload-image.js"></script>
    <script src="/bower_components/blueimp-file-upload/js/jquery.fileupload-audio.js"></script>
    <script src="/bower_components/blueimp-file-upload/js/jquery.fileupload-video.js"></script>
    <script src="/bower_components/blueimp-file-upload/js/jquery.fileupload-validate.js"></script>
</body>
</html>
